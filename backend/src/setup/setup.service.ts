import { Injectable, Logger, OnModuleInit, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { DataSource } from "typeorm";
import { ConfigService } from "src/config/config.service";
import { SetupStatus, SetupResult, RecoveryVerification } from "./interfaces/setup.interface";
import { InitializeDto } from "./dto/initialize.dto";
import { ResetSetupDto, ResetSetupResponseDto } from "./dto/reset.dto";
import { VerifyRecoveryDto } from "./dto/verify-recovery.dto";
import { CredoAgentService } from "src/credo-agent/credo-agent.service";

@Injectable()
export class SetupService implements OnModuleInit {
    private readonly logger = new Logger(SetupService.name);
    private readonly setupFile: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        private readonly credoAgentService: CredoAgentService
    ) {
        this.setupFile = this.configService.setup.setupFlagPath;
    }

    onModuleInit() {
        this.ensureSetupDirectory();
    }

    private ensureSetupDirectory() {
        const dir = path.dirname(this.setupFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private readSetup(): any | null {
        if (!fs.existsSync(this.setupFile)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(this.setupFile, "utf-8"));
    }

    private writeSetup(data: any) {
        fs.writeFileSync(this.setupFile, JSON.stringify(data, null, 2));
    }

    private generateRecoveryPhrase(): string {
        return Array.from({length: 12})
        .map(() => crypto.randomBytes(2).toString('hex'))
        .join(' ');
    }

    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    getStatus(): SetupStatus {
        const setup = this.readSetup();

        return {
            requiredSetup: !setup,
            serverName: setup?.serverName ?? null,
            version: process.env.npm_package_version || "unknown"
        }
    }

    async initialize(dto: InitializeDto): Promise<SetupResult> {
        if (this.readSetup()) {
            throw new BadRequestException("Setup has already been completed.");
        }

        if (dto.adminPassword !== dto.confirmPassword) {
            throw new BadRequestException("Admin password and confirmation do not match.");
        }

        const recoveryPhrase = this.generateRecoveryPhrase();
        const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

        const setupData = {
            serverName: dto.serverName,
            recoveryPhrase,
            admin: {
                id: uuidv4(),
                email: dto.adminEmail,
                name: dto.adminName,
                passwordHash,
                role: "admin"
            },
            createdAt: new Date().toISOString()
        }

        this.writeSetup(setupData);
        this.logger.log("Setup completed successfully.");

        const adminDid = await this.credoAgentService.createDid(dto.adminName);
        setupData.admin.id = adminDid;

        return {
            success: true,
            recoveryPhrase,
            message: "Save this recovery phrase securely. It will not be shown again.",
            adminUser: {
                id: setupData.admin.id,
                email: setupData.admin.email,
                name: setupData.admin.name,
            }
        }
    }

    verifyRecoveryPhrase(dto: VerifyRecoveryDto): RecoveryVerification {
        const setup = this.readSetup();
        if (!setup) {
            throw new BadRequestException("Setup has not been initialized.");
        }

        if (
            setup.admin.email !== dto.email ||
            setup.recoveryPhrase !== dto.recoveryPhrase
        ) {
            return {valid: false, message: "Invalid email or recovery phrase."};
        }

        return {
            valid: true,
            token: this.generateToken(),
            message: "Recovery phrase verified successfully."
        }
    }

    async reset(dto: ResetSetupDto): Promise<ResetSetupResponseDto> {
        if (!dto.confirmReset) {
            throw new BadRequestException("Reset confirmation is required.");
        }

        const setup = this.readSetup();
        if (!setup) {
            throw new BadRequestException("Setup has not been initialized.");
        }

        const passwordValid = await bcrypt.compare(
            dto.adminPassword,
            setup.admin.passwordHash
        )

        if (!passwordValid || setup.recoveryPhrase !== dto.recoveryPhrase) {
            throw new BadRequestException("Invalid admin password or recovery phrase.");
        }

        fs.unlinkSync(this.setupFile);
        this.logger.log("Setup has been reset.");

        return {
            success: true,
            message: "Setup has been reset. Restart required.",
            restartToken: this.generateToken()
        }
    }


}