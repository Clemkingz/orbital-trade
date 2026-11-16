import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/** Backend scaffold — not implemented yet. The web and admin apps currently run on browser mock data. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix("api/v1"); // matches the public /api path in vercel.json and the web client
  await app.listen(Number(process.env.API_PORT ?? 4000));
}
bootstrap();
