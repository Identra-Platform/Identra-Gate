import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';
import { InitializeDto } from './dto/initialize.dto';
import { ResetSetupDto } from './dto/reset.dto';
import { VerifyRecoveryDto } from './dto/verify-recovery.dto';

@Controller('setup')
export class SetupController {
    constructor(private readonly setupService: SetupService) {}

    @Get("status")
    getStatus() {
        return this.setupService.getStatus();
    }

    @Post("initialize")
    async Initialize(@Body() dto: InitializeDto) {
        const result = await this.setupService.initialize(dto);
        const agent = this.setupService["credoAgentService"].getAgent();
        console.log("Credo Agent initiaalized: ", agent);

        return result;
    }

    @Post("verify-recovery")
    verifyRecoveryPhrase(@Body() dto: VerifyRecoveryDto) {
        return this.setupService.verifyRecoveryPhrase(dto);
    }

    @Post("reset")
    reset(@Body() dto: ResetSetupDto) {
        return this.setupService.reset(dto);
    }
}
