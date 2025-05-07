import { Module } from '@nestjs/common';
import { EnvironmentController } from './environment.controller';
import { PM2Module } from '../pm2/pm2.module';

@Module({
  imports: [PM2Module],
  controllers: [EnvironmentController],
})
export class EnvironmentModule {} 