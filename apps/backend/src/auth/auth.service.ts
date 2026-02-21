import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { generateSecret, generateSync, verifySync, generateURI } from "otplib";
import { User, UserDocument } from "@/schemas/user.schema";
import { EmailService } from "@/email/email.service";
import {
  LoginDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  FirstLoginSetupDto,
  Verify2faDto,
  TotpSetupDto,
  Update2faSettingsDto,
  JwtPayload,
  AuthChallenge,
  LoginResult,
  AuthResponse,
} from "./dto/auth.dto";

const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

// In-memory challenge store. Lightweight since challenges are short-lived.
const challengeStore = new Map<string, AuthChallenge>();

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {
    // Periodic cleanup of expired challenges
    setInterval(() => this.cleanupChallenges(), 60 * 1000);
  }

  private cleanupChallenges(): void {
    const now = new Date();
    for (const [id, challenge] of challengeStore) {
      if (challenge.expiresAt < now) {
        challengeStore.delete(id);
      }
    }
  }

  private generateRandomPassword(length = 12): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    return password;
  }

  private generateChallengeId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, role } = createUserDto;

    const plainPassword =
      createUserDto.password || this.generateRandomPassword();

    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException("Username or email already exists");
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();

    await this.emailService.sendWelcomeEmail(email, username, plainPassword);

    return this.userModel.findById(user._id).select("-password");
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (updateUserDto.username) {
      const existing = await this.userModel.findOne({
        username: updateUserDto.username,
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ConflictException("Username already taken");
      }
      user.username = updateUserDto.username;
    }

    if (updateUserDto.email) {
      const existing = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ConflictException("Email already taken");
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }

    await user.save();

    return this.userModel.findById(userId).select("-password");
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role === "admin") {
      const adminCount = await this.userModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw new ForbiddenException("Cannot delete the last admin user");
      }
    }

    await this.userModel.findByIdAndDelete(userId);
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const { usernameOrEmail, password } = loginDto;

    const user = await this.userModel.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail.toLowerCase() },
      ],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // First-login enforcement: return token but signal forced setup
    if (user.mustChangePassword || user.mustChangeEmail) {
      const tokenResponse = this.generateTokenResponse(user);
      return {
        status: "FIRST_LOGIN_REQUIRED",
        ...tokenResponse,
      };
    }

    // 2FA check
    const enabledMethods: ("emailOtp" | "totp")[] = [];
    if (user.twoFactor?.emailOtpEnabled) enabledMethods.push("emailOtp");
    if (user.twoFactor?.totpEnabled) enabledMethods.push("totp");

    if (enabledMethods.length > 0) {
      const challengeId = this.generateChallengeId();
      challengeStore.set(challengeId, {
        userId: user._id.toString(),
        methods: enabledMethods,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        totpAttempts: 0,
      });
      return {
        status: "TWO_FACTOR_REQUIRED",
        challengeId,
        methods: enabledMethods,
      };
    }

    return {
      status: "SUCCESS",
      ...this.generateTokenResponse(user),
    };
  }

  async sendEmailOtp(challengeId: string): Promise<void> {
    const challenge = challengeStore.get(challengeId);
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired challenge");
    }

    if (!challenge.methods.includes("emailOtp")) {
      throw new BadRequestException("Email OTP not enabled for this challenge");
    }

    const user = await this.userModel.findById(challenge.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(code, 10);

    user.twoFactor.emailOtpCodeHash = hash;
    user.twoFactor.emailOtpExpiresAt = new Date(Date.now() + EMAIL_OTP_TTL_MS);
    user.twoFactor.emailOtpAttempts = 0;
    user.markModified("twoFactor");
    await user.save();

    await this.emailService.sendOtpEmail(user.email, user.username, code);
  }

  async verify2fa(dto: Verify2faDto): Promise<LoginResult> {
    const challenge = challengeStore.get(dto.challengeId);
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired challenge");
    }

    if (!challenge.methods.includes(dto.method)) {
      throw new BadRequestException("Method not allowed for this challenge");
    }

    const user = await this.userModel.findById(challenge.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (dto.method === "emailOtp") {
      await this.verifyEmailOtpCode(user, dto.code);
    } else {
      this.verifyTotpCode(user, dto.code, challenge);
    }

    challengeStore.delete(dto.challengeId);

    return {
      status: "SUCCESS",
      ...this.generateTokenResponse(user),
    };
  }

  private async verifyEmailOtpCode(
    user: UserDocument,
    code: string
  ): Promise<void> {
    if (
      !user.twoFactor?.emailOtpCodeHash ||
      !user.twoFactor?.emailOtpExpiresAt
    ) {
      throw new BadRequestException(
        "No OTP sent. Please request a new code first."
      );
    }

    if (user.twoFactor.emailOtpExpiresAt < new Date()) {
      throw new BadRequestException("OTP has expired. Please request a new code.");
    }

    if (user.twoFactor.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException(
        "Too many failed attempts. Please request a new code."
      );
    }

    const isValid = await bcrypt.compare(code, user.twoFactor.emailOtpCodeHash);

    if (!isValid) {
      user.twoFactor.emailOtpAttempts += 1;
      user.markModified("twoFactor");
      await user.save();
      const remaining = MAX_OTP_ATTEMPTS - user.twoFactor.emailOtpAttempts;
      throw new BadRequestException(
        `Invalid OTP code.${remaining > 0 ? ` ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : " Please request a new code."}`
      );
    }

    // Clear OTP state after success
    user.twoFactor.emailOtpCodeHash = null;
    user.twoFactor.emailOtpExpiresAt = null;
    user.twoFactor.emailOtpAttempts = 0;
    user.markModified("twoFactor");
    await user.save();
  }

  private verifyTotpCode(
    user: UserDocument,
    code: string,
    challenge: AuthChallenge
  ): void {
    if (!user.twoFactor?.totpSecret) {
      throw new BadRequestException("TOTP not configured");
    }

    if (challenge.totpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException(
        "Too many failed attempts. Please log in again."
      );
    }

    const result = verifySync({
      token: code,
      secret: user.twoFactor.totpSecret,
    });

    if (!result || !result.valid) {
      challenge.totpAttempts += 1;
      const remaining = MAX_OTP_ATTEMPTS - challenge.totpAttempts;
      if (remaining <= 0) {
        // Invalidate the challenge so the user must restart login
        challengeStore.delete(
          [...challengeStore.entries()].find(([, v]) => v === challenge)?.[0] ?? ""
        );
        throw new UnauthorizedException(
          "Too many failed attempts. Please log in again."
        );
      }
      throw new BadRequestException(
        `Invalid TOTP code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      );
    }
  }

  async generateTotpSetup(
    userId: string
  ): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      label: user.email,
      issuer: "PM2 Dashboard",
      secret,
    });

    const QRCode = await import("qrcode");
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store pending secret (not yet enabled — enabled after verify)
    user.twoFactor.totpSecret = secret;
    user.markModified("twoFactor");
    await user.save();

    return { secret, otpauthUrl, qrDataUrl };
  }

  async enableTotp(userId: string, dto: TotpSetupDto): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!user.twoFactor?.totpSecret) {
      throw new BadRequestException(
        "TOTP setup not initiated. Call /auth/2fa/totp/setup first."
      );
    }

    const result = verifySync({
      token: dto.code,
      secret: user.twoFactor.totpSecret,
    });

    if (!result || !result.valid) {
      throw new UnauthorizedException(
        "Invalid TOTP code. Please scan the QR code again."
      );
    }

    user.twoFactor.totpEnabled = true;
    user.markModified("twoFactor");
    await user.save();
  }

  async update2faSettings(
    userId: string,
    dto: Update2faSettingsDto
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (dto.emailOtpEnabled !== undefined) {
      user.twoFactor.emailOtpEnabled = dto.emailOtpEnabled;
    }

    if (dto.totpEnabled !== undefined) {
      if (dto.totpEnabled && !user.twoFactor?.totpSecret) {
        throw new BadRequestException(
          "TOTP must be set up and verified before enabling. Use /auth/2fa/totp/setup and /auth/2fa/totp/enable first."
        );
      }
      user.twoFactor.totpEnabled = dto.totpEnabled;
      if (!dto.totpEnabled) {
        // Wipe secret when disabled
        user.twoFactor.totpSecret = null;
      }
    }

    user.markModified("twoFactor");
    await user.save();
  }

  async completeFirstLogin(
    userId: string,
    dto: FirstLoginSetupDto
  ): Promise<AuthResponse> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    if (!user.mustChangePassword && !user.mustChangeEmail) {
      throw new BadRequestException("First login already completed");
    }

    // Validate new email uniqueness
    const existingEmail = await this.userModel.findOne({
      email: dto.newEmail,
      _id: { $ne: userId },
    });
    if (existingEmail) {
      throw new ConflictException("Email already taken");
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.email = dto.newEmail;
    user.mustChangePassword = false;
    user.mustChangeEmail = false;
    await user.save();

    return this.generateTokenResponse(user);
  }

  async validateUser(payload: JwtPayload): Promise<UserDocument | null> {
    return this.userModel.findById(payload.sub);
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select("-password");
  }

  async getUsers(): Promise<UserDocument[]> {
    return this.userModel.find().select("-password");
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (updateProfileDto.username) {
      const existing = await this.userModel.findOne({
        username: updateProfileDto.username,
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ConflictException("Username already taken");
      }
      user.username = updateProfileDto.username;
    }

    if (updateProfileDto.email) {
      const existing = await this.userModel.findOne({
        email: updateProfileDto.email,
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ConflictException("Email already taken");
      }
      user.email = updateProfileDto.email;
    }

    await user.save();

    return this.userModel.findById(userId).select("-password");
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await user.save();
  }

  async createAdminIfNotExists(): Promise<void> {
    const adminExists = await this.userModel.findOne({ role: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      const admin = new this.userModel({
        username: "admin",
        email: "admin@pm2dashboard.local",
        password: hashedPassword,
        role: "admin",
        mustChangePassword: true,
        mustChangeEmail: true,
        isDefaultAdmin: true,
      });
      await admin.save();
      console.log(
        "Default admin user created (username: admin, password: admin)"
      );
    }
  }

  private generateTokenResponse(user: UserDocument): AuthResponse {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        mustChangeEmail: user.mustChangeEmail,
        twoFactor: {
          emailOtpEnabled: user.twoFactor?.emailOtpEnabled ?? false,
          totpEnabled: user.twoFactor?.totpEnabled ?? false,
        },
      },
    };
  }
}
