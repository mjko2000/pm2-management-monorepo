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
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

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

    // Prevent self-deletion
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
