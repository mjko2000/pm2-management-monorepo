import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { McpPermission } from "../mcp/mcp.permissions";

@Schema({ timestamps: true, collection: "mcp_tokens" })
export class McpToken extends Document {
  @Prop({ required: true, maxlength: 64 })
  name: string;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ required: true })
  tokenPrefix: string;

  @Prop({ type: [String], required: true })
  permissions: McpPermission[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}

export const McpTokenSchema = SchemaFactory.createForClass(McpToken);
