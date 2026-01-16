import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import {
  Environment,
  PackageManager,
  ServiceStatus,
  ServiceVisibility,
} from "@pm2-dashboard/shared";

@Schema()
export class Service extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  repositoryUrl: string;

  @Prop({ required: true })
  branch: string;

  @Prop({ type: Types.ObjectId, ref: "GithubToken" })
  githubTokenId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  createdBy?: Types.ObjectId;

  @Prop({ required: true, enum: ["private", "public"], default: "private" })
  visibility: ServiceVisibility;

  @Prop()
  sourceDirectory?: string;

  @Prop()
  nodeVersion?: string;

  @Prop({ required: true, default: false })
  useNpm: boolean;

  @Prop()
  npmScript?: string;

  @Prop()
  npmArgs?: string;

  @Prop({})
  script: string;

  @Prop()
  args?: string;

  @Prop({ type: [{ name: String, description: String, variables: Object }] })
  environments: Environment[];

  @Prop()
  activeEnvironment?: string;

  @Prop({
    required: true,
    enum: Object.values(ServiceStatus),
    default: ServiceStatus.STOPPED,
  })
  status: ServiceStatus;

  @Prop()
  pm2AppName?: string;

  @Prop()
  repoPath?: string;

  @Prop({ default: null })
  cluster?: number | null;

  @Prop({ default: false })
  autostart?: boolean;

  @Prop({ required: true, enum: ["yarn", "npm", "pnpm"], default: "yarn" })
  packageManager: PackageManager;

  // Webhook CI/CD fields
  @Prop()
  deployKey?: string;

  @Prop({ default: false })
  webhookEnabled?: boolean;

  @Prop()
  githubWebhookId?: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
