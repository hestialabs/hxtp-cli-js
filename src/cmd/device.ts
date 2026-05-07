import * as p from '@clack/prompts';
import { requireAuth, HttpClient } from '../lib/client.js';
import { theme } from '../ui/theme.js';
import { pulse } from '../ui/pulse.js';
import { DeviceOptions } from './types.js';

export async function deviceCreateCmd(options: DeviceOptions) {
  try {
    const auth = await requireAuth();
    const hxtpClient = new HttpClient(auth.apiUrl, auth.token);

    let homeId = options.homeId;
    let deviceType = options.type;

    if (!homeId) {
      const { SecureStore } = await import('../lib/store.js');
      const store = new SecureStore();
      homeId = (await store.getActiveSpaceID()) ?? undefined;
    }

    console.log(theme.header('Add New Device'));
    console.log(theme.subHeader('Connecting a new device to your home.\n'));

    let homesList: import('../lib/client.js').Home[] = [];
    try {
      const homeResult = await pulse('Discovering available homes...', async () => {
        return hxtpClient.listHomes();
      });
      console.log(`✅ ${theme.success('Home discovery complete.')}`);
      homesList = homeResult.homes || [];
    } catch (err: unknown) {
      console.log('❌');
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Discovery failed: ${msg}`, { cause: err });
    }

    if (homesList.length === 0) {
      throw new Error('No homes found. Please create a home in the dashboard first.');
    }

    if (!homeId) {
      const homeOpts = homesList.map((h) => ({ value: h.id, label: h.name }));
      const selected = await p.select({
        message: 'Select Target Home',
        options: homeOpts,
      });
      if (p.isCancel(selected)) process.exit(0);
      homeId = selected as string;
    }

    if (!deviceType) {
      const selected = await p.text({
        message: 'Device Type',
        placeholder: 'e.g. gateway, light, sensor',
        validate: (s) => (s.trim().length === 0 ? 'Device type is required' : undefined),
      });
      if (p.isCancel(selected)) process.exit(0);
      deviceType = selected as string;
    }

    let regResult: { device_id: string; device_secret: string; api_base_url?: string };
    try {
      regResult = await pulse('Registering device...', async () => {
        return hxtpClient.registerDevice(deviceType, homeId, {});
      });
      console.log(`✅ ${theme.success('Device registered successfully.')}`);
    } catch (err: unknown) {
      console.log('❌');
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Registration failed: ${msg}`, { cause: err });
    }

    const createdDeviceId = regResult.device_id;
    const secret = regResult.device_secret;

    console.log();
    console.log(theme.success('Device Successfully Added!'));
    console.log(`ID:     ${theme.accent(createdDeviceId)}`);
    console.log(`Secret: ${theme.accent(secret)}`);
    console.log();
    console.log(theme.dim('IMPORTANT: Store this secret securely. It will never be shown again.'));

    if (regResult.api_base_url) {
      console.log(`Endpoint: ${regResult.api_base_url}`);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    process.exit(1);
  }
}
