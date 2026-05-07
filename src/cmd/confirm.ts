import { requireAuth, HttpClient } from '../lib/client.js';
import { theme } from '../ui/theme.js';
import { GlobalOptions } from './types.js';

export async function confirmCmd(
  deviceId: string,
  token: string,
  _options: GlobalOptions,
) {
  try {
    const auth = await requireAuth();
    const hxtpClient = new HttpClient(auth.apiUrl, auth.token);

    process.stdout.write('🔐 Validating safety token... ');

    await hxtpClient.confirmCommand(deviceId, token);

    console.log('✅');
    console.log(`${theme.success('Safety gate passed. Action released to hardware.')}`);
  } catch (err: unknown) {
    console.log('❌');
    if (err instanceof Error) {
      console.error(err.message);
    }
    process.exit(1);
  }
}
