import * as p from '@clack/prompts';
import open from 'open';
import crypto from 'node:crypto';
import { theme } from '../ui/theme.js';
import { HttpClient } from '../lib/client.js';
import { SecureStore } from '../lib/store.js';
import { pulse } from '../ui/pulse.js';

export async function loginFlow() {
  let apiUrl = 'https://api.hestialabs.in/api/v1';
  let token = '';

  console.log(theme.header('Welcome to HxTP 3.0'));
  console.log(theme.subHeader('Log in to your Hestia Cloud account.\n'));

  const loginMethod = await p.select({
    message: 'How do you want to authenticate?',
    options: [
      { value: 'browser', label: 'Browser Login' },
      { value: 'manual', label: 'Manual API Token' },
    ],
  });

  if (p.isCancel(loginMethod)) {
    process.exit(0);
  }

  if (loginMethod === 'browser') {
    const bytes = crypto.randomBytes(32);
    const handshakeId = `HXT-${bytes.toString('hex')}`;
    const loginUrl = `${apiUrl}/auth/cli?code=${handshakeId}`;

    const clickableUrl = `\x1B]8;;${loginUrl}\x07${loginUrl}\x1B]8;;\x07`;
    const maskedId = `HXT-${'*'.repeat(64)}`;

    console.log(theme.header('CLI Authorization'));
    console.log(`Action Required: ${theme.subHeader('Authorize this CLI in your browser')}`);
    console.log(`Security URL: ${theme.accentMsg(clickableUrl)}`);
    console.log(`Verification Code: ${theme.accentMsg(maskedId)}\n`);

    await open(loginUrl);

    const client = new HttpClient(apiUrl);
    try {
      token = await pulse('Waiting for browser authorization...', async () => {
        const timeout = Date.now() + 5 * 60 * 1000;
        while (Date.now() < timeout) {
          const t = await client.pollHandshake(handshakeId);
          if (t) return t;
          await new Promise((r) => setTimeout(r, 2000));
        }
        throw new Error('AUTH_TIMEOUT: Handshake session expired');
      });
    } catch (err: unknown) {
      console.log('❌');
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
      process.exit(1);
    }
  } else {
    console.log(theme.subHeader('Enter your secure Gateway URL and Token from the dashboard.'));

    const group = await p.group(
      {
        url: () =>
          p.text({
            message: 'API Gateway URL',
            placeholder: 'https://api.hestialabs.in/api/v1',
            defaultValue: 'https://api.hestialabs.in/api/v1',
          }),
        token: () =>
          p.password({
            message: 'Secure API Token',
            mask: '*',
          }),
      },
      {
        onCancel: () => process.exit(0),
      },
    );

    apiUrl = group.url;
    token = group.token;
  }

  const hxtpClient = new HttpClient(apiUrl, token);
  try {
    await pulse('Verifying credentials...', async () => {
      try {
        await hxtpClient.sendCommand('ping', 'status', {}, false);
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('404')) {
          throw err;
        } else if (!(err instanceof Error)) {
          throw err;
        }
      }
    });
  } catch (err: unknown) {
    console.log('❌');
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Authentication failed: ${msg}`);
    process.exit(1);
  }

  const store = new SecureStore();
  await store.saveToken(token);

  const config: import('../lib/store.js').Config = {
    api_url: apiUrl,
    last_login: new Date().toISOString(),
  };

  // ── 3. Auto-Retrieve User Context ────────────
  await pulse('Configuring user profile...', async () => {
    try {
      const res = await hxtpClient.listHomes();
      const homes = res.homes || [];
      if (homes.length === 1) {
        config.active_space_id = homes[0].id;
      }
    } catch {
      // Non-fatal
    }
  });

  await store.saveConfig(config);

  console.log(`✅ ${theme.success('Credentials verified.')}\n`);
  console.log(`${theme.success('Successfully authenticated!')}`);
  console.log(`${theme.dim('Encrypted')} credentials secured in system keychain.`);
}
