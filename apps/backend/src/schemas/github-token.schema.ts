import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type GithubTokenDocument = GithubToken & Document;

@Schema({ timestamps: true })
export class GithubToken {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: ["private", "public"], default: "private" })
  visibility: "private" | "public";

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;
}

export const GithubTokenSchema = SchemaFactory.createForClass(GithubToken);
