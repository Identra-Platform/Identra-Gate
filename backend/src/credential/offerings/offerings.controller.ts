import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OfferingsService } from './offerings.service';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';

@Controller('offerings')
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @Post()
  create(@Body() createOfferingDto: CreateOfferingDto) {
    return this.offeringsService.create(createOfferingDto);
  }

  @Get()
  findAll() {
    return this.offeringsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offeringsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOfferingDto: UpdateOfferingDto,
  ) {
    return this.offeringsService.update(id, updateOfferingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offeringsService.remove(id);
  }
}
