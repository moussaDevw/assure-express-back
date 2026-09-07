import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';

@Module({
  imports: [PrismaModule, InsuranceModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
