import { Controller, Post, Body, UseGuards, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthGuard } from "./guards/auth.guard";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("login")
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post("refresh")
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    @Post("logout")
    logout() {
        return this.authService.logout();
    }

    @UseGuards(AuthGuard)
    @Get("me")
    me(@Req() req) {
        return req.user;
    }

}