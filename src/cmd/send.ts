import { Command } from 'commander';
import { requireAuth as getAuth, HttpClient } from '../lib/client.js';
import { theme } from '../ui/theme.js';
import { HXTPClient as Client, HXTPCommandPayload } from '@hestialabs/hxtp-js';
import { nodeCrypto } from '@hestialabs/hxtp-js/crypto/node';
import { MQTTTransport } from '@hestialabs/hxtp-js/transport/mqtt';
import { pulse } from '../ui/pulse.js';
import { GlobalOptions } from './types.js';

export async function sendCmd(
  deviceId: string,
  action: string,
  options: GlobalOptions & { param?: string[]; dryRun?: boolean },
  cmd: Command,
) {
  try {
    const { token, apiUrl, tenantId, clientId, secret } = await getAuth();
    const globalOpts = cmd.optsWithGlobals();
    const transportType = globalOpts.transport || 'rest';

    const paramMap: Record<string, unknown> = {};
    for (const p of options.param || []) {
      const parts = p.split('=');
      if (parts.length >= 2) {
        paramMap[parts[0]] = parts.slice(1).join('=');
      }
    }

    const dryRun = !!options.dryRun;
    let resp: { status: string; dry_run_token?: string };

    if (transportType === 'rest') {
      const httpClient = new HttpClient(apiUrl, token);
      resp = await pulse(
        `📡 Sending command ${theme.accent(action)} to device ${deviceId} via ${theme.secondary('REST')}`,
        () => httpClient.sendCommand(deviceId, action, paramMap, dryRun),
      );
    } else {
      // ── Native HxTP (MQTT) ──────────────────────────
      const hxtpClient = new Client({
        url: process.env.HXTP_BROKER || 'tcp://mqtt.hestialabs.in:1883',
        tenantId,
        deviceId, // For command mode, we often target a specific device
        secret,
        clientId: `hxtp-cli-js-${clientId}`,
        crypto: nodeCrypto,
      });

      const mqttTransport = new MQTTTransport({
        url: hxtpClient['config'].url,
        clientId: hxtpClient['config'].clientId,
      });

      await mqttTransport.connect();
      hxtpClient['transport'] = mqttTransport;

      const payload: HXTPCommandPayload = {
        action,
        params: paramMap,
        deviceId,
      };

      const result = await pulse(
        `📡 Sending command ${theme.accent(action)} to device ${deviceId} via ${theme.secondary('MQTT')}`,
        () => hxtpClient.sendCommand(payload),
      );

      await mqttTransport.disconnect();
      
      // Map SDK response to CLI expectation
      resp = {
        status: result.ok ? 'success' : 'failed',
        // In native mode, dry-run-required might be handled differently, 
        // but for now we follow the SDK's ok/error pattern.
      };
    }

    if (resp.status === 'dry_run_required') {
      const dryRunToken = resp.dry_run_token;
      console.log();
      console.log(theme.warning('⚠️  SAFETY GATE TRIGGERED'));
      console.log('This action requires a second confirmation. Dry-run results look stable.');
      console.log('To finalize this action, run:\n');
      console.log(`   hxtp-cli confirm ${deviceId} ${dryRunToken}\n`);
    } else {
      console.log(`${theme.success('Command successfully sent to device!')}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    process.exit(1);
  }
}
