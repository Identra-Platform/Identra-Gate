import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { OpenId4VcService } from './openid4vc.service';
import { LogsModule } from 'src/audit/logs/logs.module';

@Global()
@Module({
  imports: [ConfigModule, LogsModule],
  providers: [OpenId4VcService],
  exports: [OpenId4VcService]
})
export class OpenId4VcModule implements OnModuleInit {
  constructor(private readonly openId4VcService: OpenId4VcService) {}

  async onModuleInit() {
    await this.openId4VcService.initialize();
  }
}
