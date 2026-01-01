import { Injectable, Logger, OnModuleInit, Param } from "@nestjs/common";
import { Agent, DidsModule } from "@credo-ts/core";
import { AskarModule } from "@credo-ts/askar";
import { askar } from '@openwallet-foundation/askar-react-native';
import { DidCommModule, DidCommWsOutboundTransport } from "@credo-ts/didcomm";
import { HederaAnonCredsRegistry, HederaDidRegistrar, HederaDidResolver, HederaModule } from "@credo-ts/hedera"
import { AnonCredsModule } from "@credo-ts/anoncreds";
import { anoncreds } from "@hyperledger/anoncreds-react-native";
import { agentDependencies } from "@credo-ts/node";
import { AgentConfig, ConfigService } from "src/config/config.service";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { CredoAgentStore } from "./credo-agent-store";

type AgentModulesMap = {
    didcomm: DidCommModule<{
        transports: {
            outbound: DidCommWsOutboundTransport[];
        };
    }>;
    askar: AskarModule;
    dids: DidsModule;
    anoncreds: AnonCredsModule;
    hedera: HederaModule;
};

@Injectable ()
export class CredoAgentService implements OnModuleInit {
    private readonly logger = new Logger(CredoAgentService.name);
    private static instance: CredoAgentService;
    private agent: Agent<AgentModulesMap> | null = null;

    constructor(private readonly configService: ConfigService) {}

    static getInstance(): CredoAgentService {
        if (!this.instance) {
            this.instance = new CredoAgentService(new ConfigService());
        }
        return this.instance;
    }

    
    async create(passphrase: string, mnemonic: string[]) {
        const existingAgent = await CredoAgentStore.getInastance().load();
        if (existingAgent) {
            throw new Error("Credo Agent already exists");
        }

        const agentConfig: AgentConfig = {
            walletId: this.configService.agent.walletId,
            walletKey: await bcrypt.hash(passphrase, 10),
            menmonicHash: await bcrypt.hash(mnemonic.join(" "), 10) 
        };
        await CredoAgentStore.getInastance().save(agentConfig);
        this.logger.log("Credo Agent created and saved to storage");

        return this.loadAndInit(passphrase);
    }
    
    async loadAndInit(password: string) {
        if (this.agent) {
            return this.agent;
        }

        const config = await CredoAgentStore.getInastance().load();
        if (!config) {
            throw new Error("Credo Agent not found in storage");
        }
        const passwordHash = await bcrypt.hash(password, 10);

        if (config.agent.walletId !== passwordHash) {
            throw new Error("Invalid password for Credo Agent");
        }

        this.agent = new Agent({
            dependencies: agentDependencies,
            modules: {
                didcomm: new DidCommModule({
                    transports: {
                        outbound: [new DidCommWsOutboundTransport()]
                    }
                }),
                askar: new AskarModule({
                    askar,
                    store: {
                        id: config.agent.walletId,
                        key: config.agent.walletKey
                    }
                }),
                dids: new DidsModule({
                    registrars: [new HederaDidRegistrar()],
                    resolvers: [new HederaDidResolver()]
                }),
                anoncreds: new AnonCredsModule({
                    registries: [new HederaAnonCredsRegistry()],
                    anoncreds
                }),
                hedera: new HederaModule({
                    networks: [{
                        network: "testnet",
                        operatorId: "0.0.7427588",
                        operatorKey: "302e020100300506032b657004220420b1f5f5f4e1c3e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4"
                    }]
                })
            }
        });
        await this.agent.initialize();
        this.logger.log("Credo Agent loaded and initialized from storage");
        return this.agent;
    }

    async onModuleInit() {
        this.agent = new Agent({
            dependencies: agentDependencies,
            modules: {
                didcomm: new DidCommModule({
                    transports: {
                        outbound: [new DidCommWsOutboundTransport()]
                    }
                }),
                askar: new AskarModule({
                    askar,
                    store: {
                        id: this.configService.agent.walletId,
                        key: this.configService.agent.walletKey
                    }
                }),
                dids: new DidsModule({
                    registrars: [new HederaDidRegistrar()],
                    resolvers: [new HederaDidResolver()]
                }),
                anoncreds: new AnonCredsModule({
                    registries: [new HederaAnonCredsRegistry()],
                    anoncreds
                }),
                hedera: new HederaModule({
                    networks: [{
                        network: "testnet",
                        operatorId: "0.0.7427588",
                        operatorKey: "302e020100300506032b657004220420b1f5f5f4e1c3e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4"
                    }]
                })
            }
        });
        await this.agent.initialize();
        this.logger.log("Credo Agent initialized");

        return this.agent;
    }

    getAgent(): Agent {
        if (!this.agent) {
            throw new Error("Credo Agent not initialized");
        }
        return this.agent;
    }

    async shutdown() {
        if (!this.agent) return;
        await this.agent.shutdown();
        this.logger.log("Credo Agent shutdown");
        this.agent = null; 
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