/**
 * Logger utilities for seed script
 */

import chalk from 'chalk';

export class Logger {
  private silent: boolean;

  constructor(silent: boolean = false) {
    this.silent = silent;
  }

  info(message: string): void {
    if (!this.silent) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  success(message: string): void {
    if (!this.silent) {
      console.log(chalk.green('✓'), message);
    }
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  warn(message: string): void {
    if (!this.silent) {
      console.log(chalk.yellow('⚠'), message);
    }
  }

  section(title: string): void {
    if (!this.silent) {
      console.log('\n' + chalk.bold.cyan(`─── ${title} ───`) + '\n');
    }
  }

  step(current: number, total: number, message: string): void {
    if (!this.silent) {
      console.log(chalk.gray(`[${current}/${total}]`), message);
    }
  }

  summary(items: Array<{ label: string; value: string | number }>): void {
    if (!this.silent) {
      console.log('\n' + chalk.bold('Summary:'));
      for (const item of items) {
        console.log(
          chalk.gray('  •'),
          chalk.white(item.label + ':'),
          chalk.cyan(item.value)
        );
      }
      console.log('');
    }
  }
}

export const logger = new Logger();
