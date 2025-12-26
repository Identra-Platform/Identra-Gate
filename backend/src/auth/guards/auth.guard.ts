import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException("No authorization header");
        }

        const [, token] = authHeader.split(" ");

        try {
            const payload = this.jwt.verify(token);
            request.user = payload;
            return true;
        } catch (e) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }
}