import { forwardRef, Module } from "@nestjs/common";
import { AgentProvider } from "./agent.provider";
import { OpenId4VcService } from "./openid4vc.service";
import { ConfigModule } from "src/config/config.module";
import { SessionManagerService } from "./session-manager.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NetworkInfoModule } from "src/network-info/network-info.module";
import { TemplatesModule } from "src/credentials/templates/templates.module";
import { Credential } from "src/credentials/entities/credential.entity";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Credential]), NetworkInfoModule,
    forwardRef(() => TemplatesModule)
  ],
  providers: [AgentProvider, OpenId4VcService, SessionManagerService],
  exports: [OpenId4VcService]
})
export class CredoModule {}