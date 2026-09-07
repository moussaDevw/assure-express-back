import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { KiirayStrategy } from './strategies/kiiray.strategy';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [InsuranceController],
  providers: [InsuranceService, KiirayStrategy],
  exports: [InsuranceService],
})
export class InsuranceModule {}
