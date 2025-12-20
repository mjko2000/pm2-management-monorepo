import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type DomainDocument = Domain & Document;

export type DomainStatus = "pending" | "verified" | "active" | "error";

@Schema({ timestamps: true })
export class Domain {
  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  port: number;

  @Prop({ type: Types.ObjectId, ref: "Service", required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ["pending", "verified", "active", "error"],
    default: "pending",
  })
  status: DomainStatus;

  @Prop()
  sslEnabled: boolean;

  @Prop()
  sslExpiresAt: Date;

  @Prop()
  errorMessage: string;

  @Prop()
  nginxConfigPath: string;

  @Prop()
  lastCheckedAt: Date;

  @Prop()
  activatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

// Ensure unique domain per service
DomainSchema.index({ domain: 1 }, { unique: true });
DomainSchema.index({ serviceId: 1 });

