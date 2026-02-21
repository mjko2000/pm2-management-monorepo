import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ _id: false })
class TwoFactorSettings {
  @Prop({ default: false })
  emailOtpEnabled: boolean;

  @Prop({ default: false })
  totpEnabled: boolean;

  @Prop({ default: null })
  totpSecret: string | null;

  @Prop({ default: null })
  emailOtpCodeHash: string | null;

  @Prop({ default: null })
  emailOtpExpiresAt: Date | null;

  @Prop({ default: 0 })
  emailOtpAttempts: number;
}

const TwoFactorSettingsSchema = SchemaFactory.createForClass(TwoFactorSettings);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: "user" })
  role: "admin" | "user";

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  mustChangePassword: boolean;

  @Prop({ default: false })
  mustChangeEmail: boolean;

  @Prop({ default: false })
  isDefaultAdmin: boolean;

  @Prop({ type: TwoFactorSettingsSchema, default: () => ({}) })
  twoFactor: TwoFactorSettings;
}

export const UserSchema = SchemaFactory.createForClass(User);
