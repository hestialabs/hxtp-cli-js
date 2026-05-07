import chalk from 'chalk';
import * as p from '@clack/prompts';
import { SecureStore } from '../lib/store.js';
import { HttpClient, Room } from '../lib/client.js';
import { SpaceOptions } from './types.js';

const store = new SecureStore();

async function getSpaceId(cmdHomeId?: string): Promise<string | null> {
  if (cmdHomeId) return cmdHomeId;
  return await store.getActiveSpaceID();
}

export async function listRooms(options: { space?: string }) {
  const homeId = await getSpaceId(options.space);
  if (!homeId) {
    p.log.error(
      chalk.red('Smart Space ID is required. Use --space [id] or "hxtp-cli space use [id]"'),
    );
    return;
  }

  const token = await store.getToken();
  const cfg = await store.loadConfig();
  if (!token) return;

  const client = new HttpClient(cfg.api_url, token);
  const s = p.spinner();
  s.start('Fetching rooms...');

  try {
    const res = await client.listRooms(homeId);
    s.stop('Rooms fetched');

    const rooms = res.rooms || [];
    if (rooms.length === 0) {
      p.log.info('No rooms found in this space.');
      return;
    }

    console.table(
      rooms.map((r: Room) => ({
        ID: r.id,
        NAME: r.name,
      })),
    );

    p.log.info(`Total: ${rooms.length} rooms`);
  } catch (err: unknown) {
    s.stop('Failed to fetch rooms', 1);
    if (err instanceof Error) {
      p.log.error(err.message);
    }
  }
}

export async function addRoom(name: string, options: SpaceOptions) {
  const homeId = await getSpaceId(options.space);
  if (!homeId) {
    p.log.error(
      chalk.red('Smart Space ID is required. Use --space [id] or "hxtp-cli space use [id]"'),
    );
    return;
  }

  const token = await store.getToken();
  const cfg = await store.loadConfig();
  if (!token) return;

  const client = new HttpClient(cfg.api_url, token);
  const s = p.spinner();
  s.start(`Adding room "${name}"...`);

  try {
    const res = await client.createRoom(homeId, name);
    s.stop('Room added');

    p.log.success(`${chalk.green('✅')} Room '${name}' successfully added to space.`);
    p.log.info(`ID: ${chalk.cyan(res.id || 'unknown')}`);
  } catch (err: unknown) {
    s.stop('Failed to add room', 1);
    if (err instanceof Error) {
      p.log.error(err.message);
    }
  }
}
