import { SecureStore } from './store.js';

export interface HandshakeResult {
  token?: string;
  status: string;
}

export interface Home {
  id: string;
  name: string;
  home_name?: string;
  timezone?: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface Device {
  id: string;
  device_type: string;
  active: boolean;
  room_id?: string;
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  async pollHandshake(handshakeId: string): Promise<string | null> {
    const url = `${this.baseUrl}/auth/handshake/${handshakeId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 200) {
        const data = (await response.json()) as HandshakeResult;
        return data.token || null;
      }
    } catch {
      // Silently fail for network jitters
    }
    return null;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404 Not Found');
      }
      throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async get<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async sendCommand(deviceId: string, action: string, params: Record<string, unknown>, dryRun: boolean) {
    return this.post<{ status: string; dry_run_token?: string }>(`/devices/${deviceId}/command`, {
      action,
      params,
      dry_run: dryRun,
    });
  }

  async confirmCommand(deviceId: string, token: string) {
    return this.post<{ status: string }>(`/devices/${deviceId}/command/confirm`, { token });
  }

  async listHomes() {
    return this.get<{ homes: Home[] }>(`/homes`);
  }

  async listRooms(homeId: string) {
    return this.get<{ rooms: Room[] }>(`/homes/${homeId}/rooms`);
  }

  async createRoom(homeId: string, name: string) {
    return this.post<{ status: string; id: string }>(`/homes/${homeId}/rooms`, { name });
  }

  async registerDevice(deviceType: string, homeId: string, options: Record<string, unknown>) {
    return this.post<{
      device_id: string;
      device_secret: string;
      api_base_url?: string;
    }>(`/devices/register`, {
      type: deviceType,
      home_id: homeId,
      ...options,
    });
  }
}

export async function requireAuth(): Promise<{
  token: string;
  apiUrl: string;
  tenantId: string;
  clientId: string;
  deviceId: string;
  secret: string;
}> {
  const store = new SecureStore();
  const token = await store.getToken();
  if (!token) {
    throw new Error("Not authenticated. Run 'hxtp-cli login'");
  }
  const apiUrl = (await store.getApiUrl()) || 'https://api.hestialabs.in/api/v1';
  const tenantId = (await store.getTenantId()) || '';
  const clientId = (await store.getClientId()) || '';
  const deviceId = (await store.getDeviceId()) || '';
  const secret = (await store.getSecret()) || '';

  return { token, apiUrl, tenantId, clientId, deviceId, secret };
}
