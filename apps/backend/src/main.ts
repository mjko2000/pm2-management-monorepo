import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { CustomLogger } from "./logger/logger.service";
import { HttpExceptionFilter } from "./logger/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new CustomLogger(app.get("LogModel"));

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  const config = new DocumentBuilder()
    .setTitle("PM2 Dashboard API")
    .setDescription("API for managing PM2 services")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT || 3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
