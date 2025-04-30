/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
import chalk from "chalk";

type LogLevel = "info" | "success" | "warning" | "error" | "debug";
type LogLocation = "server" | "app";

interface LogOptions {
  level?: LogLevel;
  timestamp?: boolean;
  context?: string;
  error?: any;
  details?: any;
}

class Logger {
  private static instances: Map<LogLocation, Logger> = new Map();
  private isDebugEnabled: boolean;
  private location: LogLocation;
  private isProduction: boolean;

  private constructor(location: LogLocation) {
    this.location = location;
    this.isDebugEnabled = process.env.NODE_ENV === "development";
    this.isProduction = process.env.NODE_ENV === "production";
  }

  public static getInstance(location: LogLocation): Logger {
    if (!Logger.instances.has(location)) {
      Logger.instances.set(location, new Logger(location));
    }
    return Logger.instances.get(location)!;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      debug: "🔍",
    };
    return emojis[level];
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const { level = "info", timestamp = true, context } = options;
    const timestampStr = timestamp ? chalk.gray(`[${this.getTimestamp()}]`) : "";
    const locationStr = chalk.magenta(`[${this.location.toUpperCase()}]`);
    const contextStr = context ? chalk.cyan(`[${context}]`) : "";
    const levelStr = this.getLevelStyle(level);
    const emoji = this.getEmoji(level);

    return `${timestampStr} ${locationStr} ${levelStr} ${emoji} ${contextStr} ${message}`;
  }

  private getLevelStyle(level: LogLevel): string {
    const styles = {
      info: chalk.bgBlue.white.bold(`[${level.toUpperCase()}]`),
      success: chalk.bgGreen.white.bold(`[${level.toUpperCase()}]`),
      warning: chalk.bgYellow.black.bold(`[${level.toUpperCase()}]`),
      error: chalk.bgRed.white.bold(`[${level.toUpperCase()}]`),
      debug: chalk.bgMagenta.white.bold(`[${level.toUpperCase()}]`),
    };
    return styles[level];
  }

  private getColor(level: LogLevel): (text: string) => string {
    const colors = {
      info: chalk.hex("#3498db"), // Bright blue
      success: chalk.hex("#2ecc71"), // Emerald green
      warning: chalk.hex("#f1c40f"), // Sunflower yellow
      error: chalk.hex("#e74c3c"), // Alizarin red
      debug: chalk.hex("#9b59b6"), // Amethyst purple
    };
    return colors[level];
  }

  private formatDetails(details: any, color: (text: string) => string): string {
    if (typeof details === "object") {
      return color(JSON.stringify(details, null, 2));
    }
    return color(details);
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      return level === "error"; // Only log errors in production
    }
    return true;
  }

  public info(message: string, options?: Omit<LogOptions, "level">): void {
    if (!this.shouldLog("info")) return;
    const formattedMessage = this.formatMessage(message, { ...options, level: "info" });
    console.log(this.getColor("info")(formattedMessage));
    if (options?.details) {
      console.log(this.formatDetails(options.details, this.getColor("info")));
    }
  }

  public success(message: string, options?: Omit<LogOptions, "level">): void {
    if (!this.shouldLog("success")) return;
    const formattedMessage = this.formatMessage(message, { ...options, level: "success" });
    console.log(this.getColor("success")(formattedMessage));
    if (options?.details) {
      console.log(this.formatDetails(options.details, this.getColor("success")));
    }
  }

  public warning(message: string, options?: Omit<LogOptions, "level">): void {
    if (!this.shouldLog("warning")) return;
    const formattedMessage = this.formatMessage(message, { ...options, level: "warning" });
    console.log(this.getColor("warning")(formattedMessage));
    if (options?.details) {
      console.log(this.formatDetails(options.details, this.getColor("warning")));
    }
  }

  public error(message: string, options?: Omit<LogOptions, "level">): void {
    if (!this.shouldLog("error")) return;
    const formattedMessage = this.formatMessage(message, { ...options, level: "error" });
    console.error(this.getColor("error")(formattedMessage));
    if (options?.error) {
      console.error(this.getColor("error")(options.error?.message || JSON.stringify(options.error, null, 2)));
      if (options.error?.stack) {
        console.error(this.getColor("error")(options.error.stack));
      }
    }
  }

  public debug(message: string, options?: Omit<LogOptions, "level">): void {
    if (!this.shouldLog("debug") || !this.isDebugEnabled) return;
    const formattedMessage = this.formatMessage(message, { ...options, level: "debug" });
    console.log(this.getColor("debug")(formattedMessage));
  }
}

export const appLogger = Logger.getInstance("app");
export const serverLogger = Logger.getInstance("server");
