import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DomainController } from "./domain.controller";
import { DomainService } from "./domain.service";
import { Domain, DomainSchema } from "../schemas/domain.schema";
import { Service, ServiceSchema } from "../schemas/service.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Domain.name, schema: DomainSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}

