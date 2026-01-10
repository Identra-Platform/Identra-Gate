import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuditService } from "../audit.service";
import { catchError, Observable, tap, throwError } from "rxjs";
import { ACTIVITY_METADATA } from "../decorators/activity-log.decorator";
import { ActivityStatus } from "../entities/activity.entity";

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const metadata = this.reflector.get(ACTIVITY_METADATA, context.getHandler());
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async (responseData) => {
        await this.logSuccess(metadata, user, responseData);
      }),
      catchError(async (error) => {
        await this.logError(metadata, user, error);
        return throwError(() => error);
      })
    );
  }

  private async logSuccess(
    metadata: any,
    user: any,
    responseData: any,
  ) {
    try {
      await this.auditService.logActivity({
        userId: user?.id || 'system',
        action: metadata.action,
        status: ActivityStatus.Success
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }
  }

  private async logError(
    metadata: any,
    user: any,
    error: any,
  ) {
    try {
      await this.auditService.logActivity({
        userId: user?.id || 'system',
        action: metadata.action,
        status: ActivityStatus.Error,
        error: error.message
      });
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }
  }
}