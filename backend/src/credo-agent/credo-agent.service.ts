import { Injectable, Logger, OnModuleInit, Param } from "@nestjs/common";
import { Agent } from "@credo-ts/core";
import { agentDependencies } from "@credo-ts/node";
import { ConfigService } from "src/config/config.service";
import { v4 as uuidv4 } from "uuid";

@Injectable ()
export class CredoAgentService implements OnModuleInit {
    private readonly logger = new Logger(CredoAgentService.name);
    private agent: Agent;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        this.agent = new Agent({
            config: {
                label: this.configService.agent.label,
                walletConfig: {
                    id: this.configService.agent.walletId,
                    key: this.configService.agent.walletKey
                },
                autoAcceptConnections: this.configService.agent.autoAcceptConnections
            } as any, // Temporary workaround for typing issue.
            dependencies: agentDependencies,
        });
        await this.agent.initialize();
        this.logger.log("Credo Agent initialized");
    }

    getAgent(): Agent {
        if (!this.agent) {
            throw new Error("Credo Agent not initialized");
        }
        return this.agent;
    }


    async createDid(alias?: string)  {
        const agent = this.getAgent();

        const didResult = await agent.dids.create({
            method: this.configService.dids.defaultMethod,
            alias,
        });

        return didResult.didState.did ?? uuidv4();
    }
}