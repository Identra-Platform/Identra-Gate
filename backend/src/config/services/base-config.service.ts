import { Injectable } from "@nestjs/common";
import Joi from "joi";
import { EnvService } from "./env.service";

@Injectable()
export abstract class BaseConfigService<T> {
  protected abstract readonly schema: Joi.Schema;
  protected abstract readonly prefix: string;

  private config: T | null = null;

  constructor(
    protected readonly envService: EnvService
  ) {}

  protected abstract transform(validatedEnv: Record<string, any>): T;

  protected stripPrefix(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = key.startsWith(this.prefix)
        ? key.substring(this.prefix.length)
        : key;

      const camelCaseKey = newKey.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelCaseKey] = obj[key];
      return acc;
    }, {} as Record<string, any>);
  }

  protected getConfig(): T {
    if (this.config === null) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  private loadConfig(): T {
    const env = this.envService.getByPrefix(this.prefix);

    const processedEnv = Object.keys(env).reduce((acc, key) => {
      const value = env[key];
      acc[key] = (typeof value === 'string' && value.trim() === '') ? undefined : value;
      return acc;
    }, {} as Record<string, any>);

    const { error, value } = this.schema.validate(processedEnv, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true,
      convert: true
    });

    if (error) {
      const messages = error.details
        .map(detail => `${detail.context?.key || 'unknown'}: ${detail.message}`)
        .join(', ');
      throw new Error(`[${this.constructor.name}] Configuration validation failed: ${messages}`);
    }

    return this.transform(value);
  }

  get(): T {
    return this.getConfig();
  }

  protected createNestedSchema(schema: Joi.Schema, required: boolean = false): Joi.Schema {
    return required ? schema.required() : schema.default({});
  }

  protected conditional(conditionKey: string, conditionValue: any, thenSchema: Joi.Schema): Joi.Schema {
    return Joi.when(conditionKey, {
      is: conditionValue,
      then: thenSchema,
      otherwise: Joi.optional(),
    });
  }
}