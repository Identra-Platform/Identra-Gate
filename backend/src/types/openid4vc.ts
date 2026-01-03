import { AskarModule } from "@credo-ts/askar";
import { OpenId4VcHolderModule, OpenId4VcIssuerModule, OpenId4VcVerifierModule } from "@credo-ts/openid4vc";

export type OpenId4VcModules<Config extends {
  issuer: { enabled: boolean };
  verifier: { enabled: boolean };
  holder: { enabled: boolean };
}> = {
  askar: AskarModule;
} & (Config['issuer']['enabled'] extends true ? { 
  openId4VcIssuer: OpenId4VcIssuerModule
} : {}) &
(Config['verifier']['enabled'] extends true ? { 
  openId4VcVerifier: OpenId4VcVerifierModule 
} : {}) &
(Config['holder']['enabled'] extends true ? { 
  openId4VcHolder: OpenId4VcHolderModule
} : {});

// Factory to create module instances
export function createOpenId4VcModules<Config extends {
  issuer: { enabled: boolean };
  verifier: { enabled: boolean };
  holder: { enabled: boolean };
}>(config: Config, options: {
  askarOptions: any;
  issuerOptions?: any;
  verifierOptions?: any;
}): OpenId4VcModules<Config> {
  const modules: any = {
    askar: new AskarModule(options.askarOptions)
  };

  if (config.issuer.enabled) {
    modules.openId4VcIssuer = new OpenId4VcIssuerModule(options.issuerOptions!);
  }

  if (config.verifier.enabled) {
    modules.openId4VcVerifier = new OpenId4VcVerifierModule(options.verifierOptions!);
  }

  if (config.holder.enabled) {
    modules.openId4VcHolder = new OpenId4VcHolderModule();
  }

  return modules;
}