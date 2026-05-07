import chalk from 'chalk';

export const theme = {
  primary: chalk.hex('#DFE6E9'),
  secondary: chalk.hex('#B2BEC3'),
  accent: chalk.hex('#74B9FF'),
  success: chalk.hex('#55E6C1'),
  warning: chalk.hex('#FAB1A0'),
  error: chalk.hex('#FF7675'),

  header: (text: string) => chalk.hex('#74B9FF').bold(text),
  subHeader: (text: string) => chalk.hex('#B2BEC3').italic(text),
  accentMsg: (text: string) => chalk.hex('#74B9FF').bold(text),
  dim: (text: string) => chalk.gray(text),
};
