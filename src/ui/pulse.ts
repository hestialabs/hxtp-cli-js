import { theme } from './theme.js';

const frames = [
  '⠋',
  '⠙',
  '⠹',
  '⠸',
  '⠼',
  '⠴',
  '⠦',
  '⠧',
  '⠇',
  '⠏',
  '⣾',
  '⣽',
  '⣻',
  '⢿',
  '⡿',
  '⣟',
  '⣯',
  '⣷',
];

export async function pulse<T>(message: string, fn: () => Promise<T>): Promise<T> {
  let frameIndex = 0;
  const interval = 1000 / 30; // 30 FPS

  process.stdout.write('\x1B[?25l'); // Hide cursor

  const timer = setInterval(() => {
    const frame = frames[frameIndex];
    process.stdout.write(`\r${theme.accent(frame)} ${theme.subHeader(message)}`);
    frameIndex = (frameIndex + 1) % frames.length;
  }, interval);

  try {
    const result = await fn();
    return result;
  } finally {
    clearInterval(timer);
    process.stdout.write('\r\x1B[K'); // Clear line
    process.stdout.write('\x1B[?25h'); // Show cursor
  }
}
