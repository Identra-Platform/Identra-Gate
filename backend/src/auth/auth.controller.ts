import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ActivityLog } from 'src/audit/decorators/activity-log.decorator';
import { ActivityAction } from 'src/audit/entities/activity.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @UseGuards(AuthGuard('local'))
  @ActivityLog({
    action: ActivityAction.Login,
  })
  @Post('login')
  async login(
    @Body() loginDto: { username: string, password: string },
    @Req() req: Request
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.login(req.user, ipAddress!, userAgent);
  }

  @UseGuards(AuthGuard('jwt'))
  @ActivityLog({
    action: ActivityAction.Logout,
  })
  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
