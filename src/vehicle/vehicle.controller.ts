import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('vehicles')
@UseGuards(AuthGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.vehicleService.create(createVehicleDto, userId);
  }

  @Get()
  async getByUser(@Request() req: any) {
    const userId = req.user.sub;
    return this.vehicleService.getByUser(userId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.vehicleService.getOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.vehicleService.update(id, updateVehicleDto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.vehicleService.delete(id, userId);
  }
}
