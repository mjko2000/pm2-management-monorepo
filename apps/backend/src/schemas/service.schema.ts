import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Environment, ServiceStatus } from "@pm2-dashboard/shared";

@Schema()
export class Service extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  repositoryUrl: string;

  @Prop({ required: true })
  branch: string;

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
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
