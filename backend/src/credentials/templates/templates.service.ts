// templates.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { TemplateField } from './entities/template-field.entity';
import { CredentialTag } from './entities/credential-tag.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CredentialTemplate } from './entities/credential-template.entity';
import { OpenId4VcService } from 'src/credo/openid4vc.service';
import { OpenId4VciCredentialConfigurationsSupportedWithFormats } from '@credo-ts/openid4vc';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(CredentialTemplate)
    private readonly templateRepository: Repository<CredentialTemplate>,
    @InjectRepository(TemplateField)
    private readonly fieldRepository: Repository<TemplateField>,
    @InjectRepository(CredentialTag)
    private readonly tagRepository: Repository<CredentialTag>,
    @Inject(forwardRef(() => OpenId4VcService))
    private readonly openId4VcService: OpenId4VcService
  ) {}

  private async updateIssuerConfiguration(completeTemplate: CredentialTemplate) {
    try {
      const issuerRecord = await this.openId4VcService.getIssuer();
      if (!issuerRecord) {
        throw new Error('Issuer not found or agent not initialized');
      }
      const issuer = (await this.openId4VcService.getAgent()).openid4vc.issuer;
      if (!issuer) {
        throw new Error('OpenID4VC issuer not available');
      }
      const currentConfigurations = issuerRecord.credentialConfigurationsSupported;
      const newCredentialConfig = completeTemplate.toOpenId4Vc();

      const updatedConfigurations: OpenId4VciCredentialConfigurationsSupportedWithFormats = {
        ...currentConfigurations,
        [completeTemplate.id]: newCredentialConfig
      };

      await issuer.updateIssuerMetadata({
        issuerId: issuerRecord.issuerId,
        credentialConfigurationsSupported: updatedConfigurations
      });
    } catch (error: any) {
      throw new Error(`Failed to update issuer configuration: ${error.message}`);
    }
  }

  async create(createDto: CreateTemplateDto) {
    try {
      // Check if template with similar name exists
      const existing = await this.templateRepository.findOne({
        where: { name: createDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Template with name "${createDto.name}" already exists`,
        );
      }

      // Process tags
      const tags = await this.processTags(createDto.tags || []);

      // Create template entity
      const template = this.templateRepository.create({
        name: createDto.name,
        description: createDto.description,
        format: createDto.format || 'sd-jwt',
        credentialType: createDto.credentialType,
        display: createDto.display,
        active: createDto.active !== undefined ? createDto.active : true,
        validityDays: createDto.validityDays,
        metadata: createDto.metadata,
        tags,
      });

      // Save template first to get ID
      const savedTemplate = await this.templateRepository.save(template);

      // Process fields with path derivation
      if (createDto.fields && createDto.fields.length > 0) {
        const fields = createDto.fields.map((fieldDto, index) => {
          return this.fieldRepository.create({
            name: fieldDto.name,
            path: this.derivePathFromName(fieldDto.name),
            required: fieldDto.required !== undefined ? fieldDto.required : true,
            type: fieldDto.type,
            description: fieldDto.description,
            pattern: fieldDto.pattern,
            min: fieldDto.min,
            max: fieldDto.max,
            options: fieldDto.options,
            defaultValue: fieldDto.defaultValue,
            order: fieldDto.order || index,
            group: fieldDto.group,
            template: savedTemplate,
          });
        });

        savedTemplate.fields = await this.fieldRepository.save(fields);
      }

      // Reload with relations
      const completeTemplate = await this.templateRepository.findOneOrFail({
        where: { id: savedTemplate.id },
        relations: ['fields', 'tags'],
      });

      await this.updateIssuerConfiguration(completeTemplate);

      return completeTemplate;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create template: ${error.message}`,
      );
    }
  }

  async findAll(queryDto?: {
    search?: string;
    type?: string;
  }) {
    try {
      const {
        search,
        type
      } = queryDto || {};
      const where: any = {};

      // Filter by tags
      if (type) {
        where.credentialType = type;
      }

      // Search by name or description
      if (search) {
        where.name = Like(`%${search}%`);
      }

      // Build query options
      const options: FindManyOptions<CredentialTemplate> = {
        where,
        relations: ['fields', 'tags']
      };

      // Execute query
      const templates = await this.templateRepository.find(
        options,
      );

      return templates;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch templates: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
        relations: ['fields', 'tags'],
      });

      if (!template) {
        throw new NotFoundException(`Template with ID "${id}" not found`);
      }

      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch template: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateTemplateDto,
  ) {
    try {
      // Find template with relations
      const template = await this.templateRepository.findOne({
        where: { id },
        relations: ['fields', 'tags'],
      });

      if (!template) {
        throw new NotFoundException(`Template with ID "${id}" not found`);
      }

      // Check name uniqueness if name is being updated
      if (updateDto.name && updateDto.name !== template.name) {
        const existing = await this.templateRepository.findOne({
          where: { name: updateDto.name },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Template with name "${updateDto.name}" already exists`,
          );
        }
        template.name = updateDto.name;
      }

      // Update basic fields
      if (updateDto.description !== undefined) {
        template.description = updateDto.description;
      }
      if (updateDto.credentialType !== undefined) {
        template.credentialType = updateDto.credentialType;
      }
      if (updateDto.display !== undefined) {
        template.display = {
          ...template.display,
          ...updateDto.display,
        };
      }
      if (updateDto.active !== undefined) {
        template.active = updateDto.active;
      }
      if (updateDto.validityDays !== undefined) {
        template.validityDays = updateDto.validityDays;
      }
      if (updateDto.metadata !== undefined) {
        template.metadata = {
          ...template.metadata,
          ...updateDto.metadata,
        };
      }

      // Update tags if provided
      if (updateDto.tags !== undefined) {
        template.tags = await this.processTags(updateDto.tags);
      }

      // Update fields if provided
      if (updateDto.fields !== undefined) {
        // Remove existing fields
        await this.fieldRepository.delete({ template: { id } });

        // Create new fields
        const fields = updateDto.fields.map((fieldDto, index) => {
          return this.fieldRepository.create({
            name: fieldDto.name,
            path: this.derivePathFromName(fieldDto.name),
            required: fieldDto.required !== undefined ? fieldDto.required : true,
            type: fieldDto.type,
            description: fieldDto.description,
            pattern: fieldDto.pattern,
            min: fieldDto.min,
            max: fieldDto.max,
            options: fieldDto.options,
            defaultValue: fieldDto.defaultValue,
            order: fieldDto.order || index,
            group: fieldDto.group,
            template,
          });
        });

        template.fields = await this.fieldRepository.save(fields);
      }

      // Save updated template
      const updatedTemplate = await this.templateRepository.save(template);

      // Reload with relations
      const completeTemplate = await this.templateRepository.findOne({
        where: { id: updatedTemplate.id },
        relations: ['fields', 'tags'],
      });

      return completeTemplate;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update template: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
        relations: ['fields', 'tags']
      });

      if (!template) {
        throw new NotFoundException(`Template with ID "${id}" not found`);
      }

      await this.templateRepository.remove(template);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete template: ${error.message}`,
      );
    }
  }

  private async processTags(tagNames: string[]): Promise<CredentialTag[]> {
    if (!tagNames || tagNames.length === 0) return [];

    const tags: CredentialTag[] = [];

    for (const tagName of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name: tagName } });

      if (!tag) {
        tag = this.tagRepository.create({ name: tagName });
        tag = await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }

  private derivePathFromName(name: string): (string | number)[] {
    if (!name || typeof name !== 'string') {
      return ['field'];
    }

    // Convert to lowercase and split by spaces/non-alphanumeric characters
    const words = name
      .toLowerCase()
      .trim()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 0);

    // Remove common stop words
    const stopWords = ['of', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for'];
    const filteredWords = words.filter(word => !stopWords.includes(word));

    // If no words left, return generic path
    if (filteredWords.length === 0) {
      return ['field'];
    }

    return filteredWords;
  }
}