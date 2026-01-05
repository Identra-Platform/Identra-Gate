import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { OpenId4VcService } from './openid4vc.service';
import { LogsModule } from 'src/audit/logs/logs.module';
import { NetworkInfoModule } from 'src/network-info/network-info.module';
import { SessionManagerService } from './session-manager/session-manager.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuedCredential } from 'src/credentials/entities/issued-credential.entity';

@Module({
  imports: [ConfigModule, LogsModule, NetworkInfoModule, TypeOrmModule.forFeature([IssuedCredential])],
  providers: [OpenId4VcService, SessionManagerService],
  exports: [OpenId4VcService]
})
export class OpenId4VcModule {}
