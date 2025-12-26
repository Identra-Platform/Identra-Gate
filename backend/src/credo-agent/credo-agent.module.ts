import { Module } from "@nestjs/common";
import { CredoAgentService } from "./credo-agent.service";

@Module({
    providers: [CredoAgentService],
    exports: [CredoAgentService],
})

export class CredoAgentModule {}