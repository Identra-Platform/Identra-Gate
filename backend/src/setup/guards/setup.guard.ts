import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import path from 'path';
import { Observable } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class SetupGuard implements CanActivate {
  private readonly logger = new Logger(SetupGuard.name);
  private readonly setupFileFlag = path.join(process.cwd(), 'data', 'setup-completed.flag');
  private readonly setupRequiredPath = path.join(process.cwd(), 'setup-required');

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.path === '/health') {
      return true;
    }

    const requiresSetup = this.isSetupRequired();

    const isSetupEndpoint = request.path.startsWith('/setup');

    if (requiresSetup && !isSetupEndpoint) {
      throw new ForbiddenException('Initial setup required. Please visit /setup');
    }

    if (!requiresSetup && isSetupEndpoint) {
      if (request.path === '/setup/status') {
        return true;
      }

      if (request.path === '/setup/reset' && request.method === 'POST') {
        return true;
      }

      this.logger.warn(`Attempt to access setup endpoint after setup completed: ${request.path}`);

      throw new ForbiddenException({
        message: 'Setup already completed',
        code: 'SETUP_ALREADY_COMPLETED',
        requiresSetup: false
      });
    }

    return true;
  }

  private isSetupRequired(): boolean {
    try {
      if (!fs.existsSync(this.setupRequiredPath)) {
        fs.writeFileSync(this.setupRequiredPath, 'true');
        this.logger.log('Created setup-required flag file');
      }

      if (fs.existsSync(this.setupFileFlag)) {
        try {
          const flagContent = fs.readFileSync(this.setupFileFlag, 'utf8');
          return false;
        } catch (error) {
          this.logger.error('Error reading setup flag file:', error);
          return true;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error checking setup status:', error);
      return true;
    }
  }
  
  getSetupStatus(): { requiresSetup: boolean; serverName?: string } {
    const requiresSetup = this.isSetupRequired();
    
    if (!requiresSetup) {
      try {
        const configPath = path.join(process.cwd(), 'data', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          return {
            requiresSetup: false,
            serverName: config.serverName
          };
        }
      } catch (error) {
        this.logger.error('Error reading config:', error);
      }
    }
    
    return { requiresSetup };
  }
}
