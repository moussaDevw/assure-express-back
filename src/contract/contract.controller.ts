import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
@UseGuards(AuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  /**
   * Protected endpoint to retrieve the list of contracts of the authenticated user.
   */
  @Get()
  async getMyContracts(@Request() req: any) {
    const userId = req.user.sub;
    return this.contractService.listContracts(userId);
  }

  /**
   * Protected endpoint to retrieve a single contract details.
   */
  @Get(':id')
  async getOneContract(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.contractService.getOne(id, userId);
  }

  /**
   * Protected endpoint to subscribe/issue a new digital auto certificate.
   * Calls Odoo, issues QR Code, and logs contract details.
   */
  @Post('subscribe')
  async subscribe(
    @Body() createContractDto: CreateContractDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.contractService.createContract(createContractDto, userId);
  }
}
