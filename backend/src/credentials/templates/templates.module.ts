import { forwardRef, Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialTemplate } from './entities/credential-template.entity';
import { TemplateField } from './entities/template-field.entity';
import { CredentialTag } from './entities/credential-tag.entity';
import { CredoModule } from 'src/credo/credo.module';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialTemplate, TemplateField, CredentialTag]),
    forwardRef(() => CredoModule)
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService]
})
export class TemplatesModule {}
