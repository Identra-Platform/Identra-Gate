import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/users/types/user-role.type';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
