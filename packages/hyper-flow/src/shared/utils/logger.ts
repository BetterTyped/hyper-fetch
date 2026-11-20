/* eslint-disable no-console */
import chalk from "chalk";

type LogLevel = "info" | "success" | "warning" | "error" | "debug";
type LogLocation = "server" | "app";

interface LogOptions {
  context?: string;
  /** Printed below the message as JSON */
  details?: unknown;
  /** An `Error` prints its message and stack, anything else prints as JSON */
  error?: unknown;
}

const emojis: Record<LogLevel, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  debug: "🔍",
};

const levelStyles: Record<LogLevel, (text: string) => string> = {
  info: chalk.bgBlue.white.bold,
  success: chalk.bgGreen.white.bold,
  warning: chalk.bgYellow.black.bold,
  error: chalk.bgRed.white.bold,
  debug: chalk.bgMagenta.white.bold,
};

const colors: Record<LogLevel, (text: string) => string> = {
  info: chalk.hex("#3498db"), // Bright blue
  success: chalk.hex("#2ecc71"), // Emerald green
  warning: chalk.hex("#f1c40f"), // Sunflower yellow
  error: chalk.hex("#e74c3c"), // Alizarin red
  debug: chalk.hex("#9b59b6"), // Amethyst purple
};

const locationLabels: Record<LogLocation, string> = {
  app: chalk.hex("#FFD700")("[APPLICATION]"),
  server: chalk.hex("#4ECDC4")("[SERVER]"),
};

const getEnvironment = () => import.meta.env.VITE_ENVIRONMENT;

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return [error.message, error.stack].filter(Boolean).join("\n");
  }
  return JSON.stringify(error, null, 2);
};

/**
 * Logs of the Electron main process. Methods are bound, so they can be passed as callbacks like `.catch(logger.error)`.
 * Production builds only print errors, and debug messages only print while developing.
 */
class Logger {
  private location: LogLocation;

  constructor(location: LogLocation) {
    this.location = location;
  }

  private print(level: LogLevel, message: string, options: LogOptions = {}) {
    const environment = getEnvironment();
    // Production only prints errors, debug only prints while developing
    if ((environment === "production" && level !== "error") || (level === "debug" && environment !== "development")) {
      return;
    }
    const { context, details, error } = options;
    const write = level === "error" ? console.error : console.log;
    const contextLabel = context ? chalk.cyan(`[${context}]`) : "";
    const header = `${chalk.gray(`[${new Date().toISOString()}]`)} ${locationLabels[this.location]} ${levelStyles[level](`[${level.toUpperCase()}]`)} ${emojis[level]} ${contextLabel} ${message}`;

    write(colors[level](header));
    if (details !== undefined) {
      write(chalk.white(JSON.stringify(details, null, 2)));
    }
    if (error !== undefined) {
      write(colors[level](formatError(error)));
    }
  }

  info = (message: string, options?: LogOptions) => this.print("info", message, options);

  success = (message: string, options?: LogOptions) => this.print("success", message, options);

  warning = (message: string, options?: LogOptions) => this.print("warning", message, options);

  error = (message: unknown, options?: LogOptions) => this.print("error", String(message), options);

  debug = (message: string, options?: LogOptions) => this.print("debug", message, options);
}

export const appLogger = new Logger("app");
export const serverLogger = new Logger("server");
