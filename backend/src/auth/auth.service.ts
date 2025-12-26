import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { DataSource } from "typeorm";
import { LoginResult, RefreshResult } from "./interfaces/auth.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto"

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource
    ) {}

    async login(dto: LoginDto): Promise<LoginResult> {
        const users = await this.dataSource.query(
            `SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1`,
            [dto.email]
        );

        if (!users.length) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const user = users[0];
        const passwordVaild = await bcrypt.compare(dto.password, user.password);

        if (!passwordVaild) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: "1h" });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: dto.rememberMe ? "30d" : "7d" });

        await this.dataSource.query(
            `UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]
        )

        this.logger.log(`User ${user.email} logged in`);

        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };
    }
        
    async refresh(dto: RefreshTokenDto): Promise<RefreshResult> {
        try {
            const payload = this.jwtService.verify(dto.refreshToken);

            const newPayLoad = {
                sub: payload.sub,
                email: payload.email,
                role: payload.role
            };

            return {
                accessToken: this.jwtService.sign(newPayLoad, { expiresIn: "1h" }),
                refreshToken: this.jwtService.sign(newPayLoad, { expiresIn: "7d" }),
                expiresIn: 3600
            };
        } catch (e) {
            throw new UnauthorizedException("Invalid refresh token");
        }
    }
    
    async logout() {
        return { success: true, message: "Logged out successfully" };
    }

}