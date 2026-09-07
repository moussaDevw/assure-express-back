import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetQuoteDto } from './dto/get-quote.dto';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) { }

  @UseGuards(AuthGuard)
  @Get('companies')
  async getCompanies() {
    return this.insuranceService.listCompanies();
  }

  /**
   * Protected endpoint to request a quote from an insurance partner.
   * Requires JWT authentication and checks ownership of the vehicle.
   */
  @UseGuards(AuthGuard)
  @Post('quote')
  async getQuote(
    @Body() getQuoteDto: GetQuoteDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    const {
      companyCode,
      vehicleId,
      duree,
      garanties,
      garantiesOptPT,
      garantiesOptAR,
      garantiesOptAS,
      cout_police,
      remise_rc,
    } = getQuoteDto;

    return this.insuranceService.requestQuote(
      companyCode,
      vehicleId,
      duree,
      garanties || [],
      {
        garantiesOptPT,
        garantiesOptAR,
        garantiesOptAS,
        cout_police,
        remise_rc,
      },
      userId,
    );
  }
}
