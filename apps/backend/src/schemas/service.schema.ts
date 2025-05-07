import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Environment } from "@pm2-dashboard/shared";

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

  @Prop({ required: true, default: false })
  useNpm: boolean;

  @Prop()
  npmScript?: string;

  @Prop({ type: [String] })
  npmArgs?: string[];

  @Prop({})
  script: string;

  @Prop({ type: [String] })
  args?: string[];

  @Prop({ type: [{ name: String, description: String, variables: Object }] })
  environments: Environment[];

  @Prop()
  activeEnvironment?: string;

  @Prop({
    required: true,
    enum: ["online", "stopped", "errored"],
    default: "stopped",
  })
  status: string;

  @Prop()
  pm2Id?: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
