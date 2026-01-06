import { Module } from "@nestjs/common";
import { AgentProvider } from "./agent.provider";
import { OpenId4VcService } from "./openid4vc.service";
import { ConfigModule } from "src/config/config.module";
import { SessionManagerService } from "./session-manager.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IssuedCredential } from "./entities/issued-credential.entity";
import { NetworkInfoModule } from "src/network-info/network-info.module";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([IssuedCredential]), NetworkInfoModule],
  providers: [AgentProvider, OpenId4VcService, SessionManagerService],
  exports: [OpenId4VcService]
})
export class CredoModule {}