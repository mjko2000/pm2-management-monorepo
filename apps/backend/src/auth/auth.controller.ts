import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  FirstLoginSetupDto,
  Verify2faDto,
  SendEmailOtpDto,
  TotpSetupDto,
  Update2faSettingsDto,
  LoginResult,
  AuthResponse,
} from "./dto/auth.dto";
import { Public } from "./decorators/public.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResult> {
    return this.authService.login(loginDto);
  }

  // ── First-login ──────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("first-login/complete")
  @HttpCode(HttpStatus.OK)
  async completeFirstLogin(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: FirstLoginSetupDto
  ): Promise<AuthResponse> {
    return this.authService.completeFirstLogin(user.userId, dto);
  }

  // ── 2FA challenge (public — no JWT yet) ─────────────────────────────────────

  @Public()
  @Post("2fa/email/send")
  @HttpCode(HttpStatus.OK)
  async sendEmailOtp(@Body() dto: SendEmailOtpDto): Promise<{ sent: boolean }> {
    await this.authService.sendEmailOtp(dto.challengeId);
    return { sent: true };
  }

  @Public()
  @Post("2fa/verify")
  @HttpCode(HttpStatus.OK)
  async verify2fa(@Body() dto: Verify2faDto): Promise<LoginResult> {
    return this.authService.verify2fa(dto);
  }

  // ── 2FA management (authenticated) ──────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("2fa/totp/setup")
  @HttpCode(HttpStatus.OK)
  async setupTotp(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.generateTotpSetup(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("2fa/totp/enable")
  @HttpCode(HttpStatus.OK)
  async enableTotp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TotpSetupDto
  ): Promise<{ enabled: boolean }> {
    await this.authService.enableTotp(user.userId, dto);
    return { enabled: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put("2fa/settings")
  async update2faSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Update2faSettingsDto
  ): Promise<{ updated: boolean }> {
    await this.authService.update2faSettings(user.userId, dto);
    return { updated: true };
  }

  // ── Profile ──────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    const fullUser = await this.authService.getUserById(user.userId);
    return {
      id: fullUser._id.toString(),
      username: fullUser.username,
      email: fullUser.email,
      role: fullUser.role,
      mustChangePassword: fullUser.mustChangePassword,
      mustChangeEmail: fullUser.mustChangeEmail,
      twoFactor: {
        emailOtpEnabled: fullUser.twoFactor?.emailOtpEnabled ?? false,
        totpEnabled: fullUser.twoFactor?.totpEnabled ?? false,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const updatedUser = await this.authService.updateProfile(
      user.userId,
      updateProfileDto
    );
    return {
      id: updatedUser._id.toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(user.userId, changePasswordDto);
    return { success: true, message: "Password changed successfully" };
  }

  // ── Admin user management ────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("users")
  async getUsers(@CurrentUser() user: CurrentUserPayload) {
    this.requireAdmin(user);
    return this.authService.getUsers();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("users")
  async createUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createUserDto: CreateUserDto
  ) {
    this.requireAdmin(user);
    return this.authService.createUser(createUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put("users/:id")
  async updateUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    this.requireAdmin(user);
    return this.authService.updateUser(id, updateUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("users/:id")
  async deleteUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    this.requireAdmin(user);

    if (user.userId === id) {
      throw new ForbiddenException("Cannot delete your own account");
    }

    await this.authService.deleteUser(id);
    return { success: true };
  }

  private requireAdmin(user: CurrentUserPayload): void {
    if (user.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }
  }
}
