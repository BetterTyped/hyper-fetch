/* eslint-disable no-console */
import chalk from "chalk";

export const logger = {
  info(...args: unknown[]) {
    console.log(chalk.cyan("ℹ"), chalk.blue.bold("info"), ...args);
  },
  warn(...args: unknown[]) {
    console.log(chalk.yellow("⚠"), chalk.yellow.bold("warn"), ...args);
  },
  error(...args: unknown[]) {
    console.log(chalk.red("✖"), chalk.red.bold("error"), ...args);
  },
  success(...args: unknown[]) {
    console.log(chalk.green("✔"), chalk.green.bold("success"), ...args);
  },
  break() {
    console.log("");
  },
};
