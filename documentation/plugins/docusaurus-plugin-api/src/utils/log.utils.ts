import chalk from "chalk";
import { name } from "../constants/name.constants";

export const error = (value: string, project?: string) =>
  console.log(
    "\n",
    chalk.bold.yellow(`[${name}]`),
    project ? chalk.bold.white(`[${project}]`) : "",
    chalk.bold.red(value),
  );
export const warning = (value: string, project?: string) =>
  console.log(
    "\n",
    chalk.bold.yellow(`[${name}]`),
    project ? chalk.bold.white(`[${project}]`) : "",
    chalk.bold.hex("#FFA500")(value),
  );
export const success = (value: string, project?: string) =>
  console.log(
    "\n",
    chalk.bold.yellow(`[${name}]`),
    project ? chalk.bold.white(`[${project}]`) : "",
    chalk.bold.green(value),
  );
export const info = (value: string, project?: string) =>
  console.log(
    "\n",
    chalk.bold.yellow(`[${name}]`),
    project ? chalk.bold.white(`[${project}]`) : "",
    chalk.bold.blue(value),
  );
export const trace = (value: string, project?: string) =>
  console.log(
    "\n",
    chalk.bold.yellow(`[${name}]`),
    project ? chalk.bold.white(`[${project}]`) : "",
    chalk.white(value),
  );
