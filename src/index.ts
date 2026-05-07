#!/usr/bin/env bun
import { Command } from 'commander';
import { loginFlow } from './cmd/login.js';
import { sendCmd } from './cmd/send.js';
import { confirmCmd } from './cmd/confirm.js';
import { deviceCreateCmd } from './cmd/device.js';

import { listSpaces, useSpace } from './cmd/space.js';
import { listRooms, addRoom } from './cmd/room.js';

const program = new Command();

program
  .name('hxtp-cli')
  .description(
    'HxTP is a secure developer-first CLI\n\nThe official Hestia Labs Cross-Platform Trust Protocol CLI. Built for developers to add, control, and manage your devices instantly.',
  )
  .version('3.1.0')
  .option('--transport <type>', 'Transport layer to use (rest, mqtt, ws)', 'rest');

program
  .command('login')
  .description(
    'Authenticate with HxTP Cloud\n\nStarts the interactive TUI login wizard to secure your credentials and link the CLI to Hestia Cloud.',
  )
  .action(loginFlow);

program
  .command('send <device_id> <action>')
  .description('Send a command to a hardware device')
  .option(
    '-p, --param <key=value>',
    'Key-value parameters (key=value)',
    (val, memo) => {
      memo.push(val);
      return memo;
    },
    [] as string[],
  )
  .option('--dry-run', 'Preview action without execution')
  .action(sendCmd);

program
  .command('confirm <device_id> <token>')
  .description('Confirm a critical gateway command')
  .action(confirmCmd);

const device = program.command('device').description('Manage HxTP devices');

device
  .command('add')
  .description('Add a new device')
  .option('--type <type>', 'Manifest type for the device')
  .option('-s, --home-id <home_id>', 'Target home UUID')
  .action(deviceCreateCmd);

const space = program.command('space').description('Manage your Smart Spaces');

space
  .command('list')
  .alias('ls')
  .description('List all your registered Smart Spaces')
  .action(listSpaces);

space
  .command('use <id>')
  .description('Set the default Smart Space for subsequent commands')
  .action(useSpace);

const room = program.command('room').description('Manage rooms within a Smart Space');

room
  .command('list')
  .alias('ls')
  .description('List rooms in a specific Smart Space')
  .option('-s, --space <id>', 'ID of the target Smart Space')
  .action(listRooms);

room
  .command('add <name>')
  .description('Add a new room to a Smart Space')
  .option('-s, --space <id>', 'ID of the target Smart Space')
  .action(addRoom);

program.parse();
