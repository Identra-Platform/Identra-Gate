import { Injectable } from "@nestjs/common";
import path from "path";
import * as fs from 'fs';
import * as dotenv from 'dotenv';

@Injectable()
export class EnvService {
  private readonly env: NodeJS.ProcessEnv;

  constructor() {
    this.env = this.loadEnvironment();
  }

  private loadEnvironment(): NodeJS.ProcessEnv {
    const nodeEnv = process.env.NODE_ENV || 'development';

    const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
    const defaultEnvPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from: ${envPath}`);
      dotenv.config({ path: envPath });
    } else if (fs.existsSync(defaultEnvPath)) {
      console.log(`Loading environment from: ${defaultEnvPath}`);
      dotenv.config({ path: defaultEnvPath });
    } else {
      console.log('No .env file found, using process.env');
    }

    return { ...process.env };
  }

  getEnv(): NodeJS.ProcessEnv {
    return { ...this.env };
  }

  get(key: string): string | undefined;
  get(key: string, defaultValue: string): string;
  get(key: string, defaultValue?: string): string | undefined {
    return this.env[key] ?? defaultValue;
  }

  getNumber(key: string): number | undefined;
  getNumber(key: string, defaultValue: number): number;
  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  getBoolean(key: string): boolean | undefined;
  getBoolean(key: string, defaultValue: boolean): boolean;
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = this.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value === 'true' || value === '1' || value === 'yes';
  }

  getArray(key: string, delimiter: string = ','): string[] {
    const value = this.env[key];
    if (!value) return [];
    return value.split(delimiter).map(item => item.trim()).filter(Boolean);
  }

  getAllKeys(): string[] {
    return Object.keys(this.env);
  }

  getByPrefix(prefix: string): Record<string, string> {
    return Object.keys(this.env).reduce((acc, key) => {
      if (key.startsWith(prefix)) {
        acc[key] = this.env[key]!;
      }
      return acc;
    }, {} as Record<string, string>);
  }

  isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  require(key: string): string {
    const value = this.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  requireNumber(key: string): number {
    const value = this.require(key);
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
    }
    return num;
  }

  requireBoolean(key: string): boolean {
    const value = this.require(key);
    return value === 'true' || value === '1' || value === 'yes';
  }
}