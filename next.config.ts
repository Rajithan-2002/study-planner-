import type { NextConfig } from "next";
import os from "os";

const getLocalIPs = (): string[] => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const key of Object.keys(interfaces)) {
    const netList = interfaces[key];
    if (netList) {
      for (const net of netList) {
        if (net.family === 'IPv4' || (net.family as any) === 4) {
          ips.push(net.address);
          ips.push(`${net.address}:3000`);
          ips.push(`${net.address}:3001`);
          ips.push(`${net.address}:3002`);
        }
      }
    }
  }
  return ips;
};

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: [
    ...getLocalIPs(),
    'localhost',
    '127.0.0.1'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: [
        ...getLocalIPs(),
        'localhost',
        'localhost:3000',
        'localhost:3001',
        'localhost:3002',
        '127.0.0.1',
        '127.0.0.1:3000',
        '127.0.0.1:3001',
        '127.0.0.1:3002'
      ]
    }
  }
};

export default nextConfig;
