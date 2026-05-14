import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { CustomLogger } from "./logger/logger.service";
import { HttpExceptionFilter } from "./logger/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new CustomLogger(app.get("LogModel"));

  // Trust the first proxy hop so rate limiting / IP-based logic see the real client IP
  // when running behind nginx or another reverse proxy.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Disabled to keep Swagger UI working in non-production envs.
      contentSecurityPolicy: false,
    })
  );

  const allowedOriginsRaw =
    process.env.ALLOWED_ORIGINS || process.env.APP_URL || "";
  const allowedOrigins = allowedOriginsRaw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server) which omit Origin.
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true })
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("PM2 Dashboard API")
      .setDescription("API for managing PM2 services")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
  }

  await app.listen(process.env.PORT || 3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
