import { Injectable, OnModuleInit } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class NetworkInfoService implements OnModuleInit {
  private localIpAddress: string;

  onModuleInit() {
    this.localIpAddress = this.getLocalIP();
  }

  getLocalIP(): string {
    const networkInterfaces = os.networkInterfaces();
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];

      for (const iface of interfaces!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  getAllIPs(): string[] {
    const networkInterfaces = os.networkInterfaces();
    const ips: string[] = [];
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      
      for (const iface of interfaces!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    
    return ips.length > 0 ? ips : ['127.0.0.1'];
  }

  getServerInfo() {
    return {
      hostname: os.hostname(),
      localIp: this.localIpAddress,
      allIps: this.getAllIPs(),
      platform: os.platform(),
      networkInterfaces: os.networkInterfaces(),
    };
  }
}
