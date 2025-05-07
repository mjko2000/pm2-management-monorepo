import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { GitHubConfig } from "@pm2-dashboard/shared";

@Schema()
export class SystemConfig extends Document {
  @Prop({ type: Object })
  github?: GitHubConfig;

  @Prop({ required: true })
  workingDirectory: string;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
