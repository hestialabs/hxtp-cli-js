import chalk from 'chalk';
import * as p from '@clack/prompts';
import { SecureStore } from '../lib/store.js';
import { HttpClient, Home } from '../lib/client.js';

const store = new SecureStore();

export async function listSpaces() {
  const token = await store.getToken();
  const cfg = await store.loadConfig();

  if (!token) {
    p.log.error(chalk.red('Not authenticated. Run "hxtp-cli login"'));
    return;
  }

  const client = new HttpClient(cfg.api_url, token);

  const s = p.spinner();
  s.start('Fetching Smart Spaces...');
  try {
    const res = await client.listHomes();
    s.stop('Smart Spaces fetched');

    const homes = res.homes || [];
    if (homes.length === 0) {
      p.log.info('No Smart Spaces found.');
      return;
    }

    const activeId = await store.getActiveSpaceID();

    console.table(
      homes.map((h: Home) => ({
        CURRENT: h.id === activeId ? '*' : '',
        ID: h.id,
        NAME: h.home_name || h.name,
        TIMEZONE: h.timezone,
      })),
    );
  } catch (err: unknown) {
    s.stop('Failed to fetch spaces', 1);
    if (err instanceof Error) {
      p.log.error(err.message);
    }
  }
}

export async function useSpace(id: string) {
  await store.setActiveSpaceID(id);
  p.log.success(`${chalk.green('✅')} Active Smart Space set to: ${chalk.cyan(id)}`);
}
