/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { select } from "@inquirer/prompts";
import { execa } from "execa";

import { Config } from "config/schema";
import { RegistryItemSchema } from "features/schema/schema";
import { getPackageManager } from "utils/get-package-manager";
import { getPackageInfo } from "utils/get-package-info";
import { spinner } from "utils/spinner";
import { logger } from "utils/logger";

export async function updateDependencies(
  dependencies: RegistryItemSchema["dependencies"],
  devDependencies: RegistryItemSchema["devDependencies"],
  config: Config,
  options: {
    silent?: boolean;
  },
) {
  dependencies = Array.from(new Set(dependencies));
  devDependencies = Array.from(new Set(devDependencies));

  if (!dependencies?.length && !devDependencies?.length) {
    return;
  }

  options = {
    silent: false,
    ...options,
  };

  const dependenciesSpinner = spinner(`Installing dependencies.`, {
    silent: options.silent,
  })?.start();
  const packageManager = await getUpdateDependenciesPackageManager(config);

  // Offer to use --force or --legacy-peer-deps if using React 19 with npm.
  let flag = "";
  if (shouldPromptForNpmFlag(config) && packageManager === "npm") {
    if (options.silent) {
      flag = "force";
    } else {
      dependenciesSpinner.stopAndPersist();
      logger.warn(
        "\nIt looks like you are using React 19. \nSome packages may fail to install due to peer dependency issues in npm (see https://ui.shadcn.com/react-19).\n",
      );
      const confirmation = await select({
        message: "How would you like to proceed?",
        choices: [
          { name: "Use --force", value: "force" },
          { name: "Use --legacy-peer-deps", value: "legacy-peer-deps" },
        ],
      });

      if (confirmation) {
        flag = confirmation;
      }
    }
  }

  dependenciesSpinner?.start();

  await installWithPackageManager(packageManager, dependencies, devDependencies, config.resolvedPaths.cwd, flag);

  dependenciesSpinner?.succeed();
}

function shouldPromptForNpmFlag(config: Config) {
  const packageInfo = getPackageInfo(config.resolvedPaths.cwd, false);

  if (!packageInfo?.dependencies?.react) {
    return false;
  }

  const hasReact19 = /^(?:\^|~)?19(?:\.\d+)*(?:-.*)?$/.test(packageInfo.dependencies.react);
  const hasReactDayPicker8 = packageInfo.dependencies["react-day-picker"]?.startsWith("8");

  return hasReact19 && hasReactDayPicker8;
}

async function getUpdateDependenciesPackageManager(config: Config) {
  const expoVersion = getPackageInfo(config.resolvedPaths.cwd, false)?.dependencies?.expo;

  if (expoVersion) {
    // Ensures package versions match the React Native version.
    // https://docs.expo.dev/more/expo-cli/#install
    return "expo";
  }

  return getPackageManager(config.resolvedPaths.cwd);
}

async function installWithPackageManager(
  packageManager: Awaited<ReturnType<typeof getUpdateDependenciesPackageManager>>,
  dependencies: string[],
  devDependencies: string[],
  cwd: string,
  flag?: string,
) {
  if (packageManager === "npm") {
    return installWithNpm(dependencies, devDependencies, cwd, flag);
  }

  if (packageManager === "deno") {
    return installWithDeno(dependencies, devDependencies, cwd);
  }

  if (packageManager === "expo") {
    return installWithExpo(dependencies, devDependencies, cwd);
  }

  if (dependencies?.length) {
    await execa(packageManager, ["add", ...dependencies], {
      cwd,
    });
  }

  if (devDependencies?.length) {
    await execa(packageManager, ["add", "-D", ...devDependencies], { cwd });
  }
}

async function installWithNpm(dependencies: string[], devDependencies: string[], cwd: string, flag?: string) {
  if (dependencies.length) {
    await execa("npm", ["install", ...(flag ? [`--${flag}`] : []), ...dependencies], { cwd });
  }

  if (devDependencies.length) {
    await execa("npm", ["install", ...(flag ? [`--${flag}`] : []), "-D", ...devDependencies], { cwd });
  }
}

async function installWithDeno(dependencies: string[], devDependencies: string[], cwd: string) {
  if (dependencies?.length) {
    await execa("deno", ["add", ...dependencies.map((dep) => `npm:${dep}`)], {
      cwd,
    });
  }

  if (devDependencies?.length) {
    await execa("deno", ["add", "-D", ...devDependencies.map((dep) => `npm:${dep}`)], { cwd });
  }
}

async function installWithExpo(dependencies: string[], devDependencies: string[], cwd: string) {
  if (dependencies.length) {
    await execa("npx", ["expo", "install", ...dependencies], { cwd });
  }

  if (devDependencies.length) {
    await execa("npx", ["expo", "install", "-- -D", ...devDependencies], {
      cwd,
    });
  }
}
