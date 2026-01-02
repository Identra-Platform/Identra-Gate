import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgentConfig, ConfigService } from '../config/config.service';
import path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AgentStoreService implements OnModuleInit {
  private config: AgentConfig | null = null;
  private configPath: string;

  constructor() {
    // Use environment variable or default
    this.configPath = process.env.AGENT_STORAGE_PATH || './data/agent-config.json';
  }

  async onModuleInit() {
    await this.load();
  }

  private async ensureDirectory(): Promise<void> {
    const dir = path.dirname(this.configPath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async load(): Promise<AgentConfig | null> {
    try {
      await this.ensureDirectory();
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data) as AgentConfig;
      console.log('Loaded agent config from:', this.configPath);
    } catch (error) {
      // File doesn't exist yet - that's OK during setup
      this.config = null;
    }
    return this.config;
  }

  async save(config: AgentConfig): Promise<void> {
    await this.ensureDirectory();
    
    await fs.writeFile(
      this.configPath, 
      JSON.stringify(this.config, null, 2),
      'utf8'
    );
    console.log('Saved agent config to:', this.configPath);
  }

  async create(walletKey: string, mnemonicHash?: string): Promise<AgentConfig> {
    const config: AgentConfig = {
      walletId: uuidv4(),
      walletKey,
      storagePath: this.configPath
    };
    
    await this.save(config);
    return config;
  }

  async update(updates: Partial<AgentConfig>): Promise<AgentConfig> {
    if (!this.config) {
      throw new Error('No agent config found. Run setup first.');
    }
    
    const updatedConfig = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.save(updatedConfig);
    return updatedConfig;
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.configPath);
    } catch (error) {
      // File might not exist, that's OK
    }
    this.config = null;
  }

  getConfig(): AgentConfig {
    if (!this.config) {
      throw new Error('Agent config not loaded. Run setup first.');
    }
    return this.config;
  }

  getWalletId(): string | undefined {
    return this.getConfig().walletId;
  }

  getWalletKey(): string | undefined {
    return this.getConfig().walletKey;
  }

  hasConfig(): boolean {
    return this.config !== null;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}