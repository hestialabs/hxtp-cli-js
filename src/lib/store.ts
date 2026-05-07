import keytar from 'keytar';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const SERVICE_NAME = 'io.hxtp.cli';
const TOKEN_ACCOUNT = 'main-token';
const CONFIG_DIR = '.hxtp';
const CONFIG_FILE = 'config.json';

export interface Config {
  api_url: string;
  tenant_id?: string;
  client_id?: string;
  device_id?: string;
  secret?: string;
  active_space_id?: string;
  last_login?: string;
}

export class SecureStore {
  async saveToken(token: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, TOKEN_ACCOUNT, token);
  }

  async getToken(): Promise<string | null> {
    if (process.env.HXTP_TOKEN) {
      return process.env.HXTP_TOKEN;
    }
    return await keytar.getPassword(SERVICE_NAME, TOKEN_ACCOUNT);
  }

  async getTenantId(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.tenant_id || null;
  }

  async clearToken(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, TOKEN_ACCOUNT);
  }

  private getConfigPath(): string {
    return path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE);
  }

  async saveConfig(cfg: Config): Promise<void> {
    const p = this.getConfigPath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  }

  async loadConfig(): Promise<Config> {
    try {
      const data = await fs.readFile(this.getConfigPath(), 'utf8');
      return JSON.parse(data);
    } catch {
      return { api_url: 'https://api.hestialabs.in/api/v1' };
    }
  }

  async getApiUrl(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.api_url;
  }

  async getClientId(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.client_id || process.env.HXTP_CLIENT_ID || null;
  }

  async getDeviceId(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.device_id || process.env.HXTP_DEVICE_ID || null;
  }

  async getSecret(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.secret || process.env.HXTP_SECRET || null;
  }

  async getActiveSpaceID(): Promise<string | null> {
    const cfg = await this.loadConfig();
    return cfg.active_space_id || null;
  }

  async setActiveSpaceID(id: string): Promise<void> {
    const cfg = await this.loadConfig();
    cfg.active_space_id = id;
    await this.saveConfig(cfg);
  }
}
