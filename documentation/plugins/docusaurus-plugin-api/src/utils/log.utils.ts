import chalk from "chalk";

export const error = (value: string) => console.log("\n", chalk.bold.red(value));
export const warning = (value: string) => console.log("\n", chalk.hex("#FFA500")(value));
export const success = (value: string) => console.log("\n", chalk.bold.green(value));
export const info = (value: string) => console.log("\n", chalk.bold.white(value));
