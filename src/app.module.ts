import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { InsuranceModule } from './insurance/insurance.module';
import { ContractModule } from './contract/contract.module';

@Module({
  imports: [PrismaModule, AuthModule, VehicleModule, InsuranceModule, ContractModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

