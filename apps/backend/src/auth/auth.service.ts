import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "@/schemas/user.schema";
import {
  LoginDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  JwtPayload,
  AuthResponse,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException("Username or email already exists");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();

    // Return user without password
    const savedUser = await this.userModel
      .findById(user._id)
      .select("-password");
    return savedUser;
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

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await this.userModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw new ForbiddenException("Cannot delete the last admin user");
      }
    }

    await this.userModel.findByIdAndDelete(userId);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { usernameOrEmail, password } = loginDto;

    // Find user by username or email
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
      },
    };
  }
}
