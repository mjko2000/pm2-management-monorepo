import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsBoolean,
  Matches,
  Length,
} from "class-validator";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MESSAGE =
  "Username can only contain letters, numbers, and underscores (no spaces)";

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  usernameOrEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(20, { message: "Username must be at most 20 characters" })
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^$|.{6,}/, {
    message: "Password must be empty or at least 6 characters long",
  })
  password?: string;

  @IsOptional()
  @IsIn(["admin", "user"])
  role?: "admin" | "user";
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(20, { message: "Username must be at most 20 characters" })
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(["admin", "user"])
  role?: "admin" | "user";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(20, { message: "Username must be at most 20 characters" })
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class FirstLoginSetupDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsNotEmpty()
  @IsEmail()
  newEmail: string;
}

export class Verify2faDto {
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @IsNotEmpty()
  @IsIn(["emailOtp", "totp"])
  method: "emailOtp" | "totp";

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}

export class SendEmailOtpDto {
  @IsNotEmpty()
  @IsString()
  challengeId: string;
}

export class TotpSetupDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Update2faSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailOtpEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  totpEnabled?: boolean;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export interface AuthChallenge {
  userId: string;
  methods: ("emailOtp" | "totp")[];
  expiresAt: Date;
  totpAttempts: number;
}

export type LoginResult =
  | {
      status: "SUCCESS";
      access_token: string;
      user: { id: string; username: string; email: string; role: string };
    }
  | {
      status: "FIRST_LOGIN_REQUIRED";
      access_token: string;
      user: { id: string; username: string; email: string; role: string };
    }
  | {
      status: "TWO_FACTOR_REQUIRED";
      challengeId: string;
      methods: ("emailOtp" | "totp")[];
    };

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
    mustChangeEmail?: boolean;
    twoFactor?: {
      emailOtpEnabled: boolean;
      totpEnabled: boolean;
    };
  };
}
