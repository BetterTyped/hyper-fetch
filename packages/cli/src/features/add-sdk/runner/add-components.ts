import z from "zod";

import { Config } from "config/schema";
import { handleError } from "utils/handle-error";
import { spinner } from "utils/spinner";
import { updateDependencies } from "../updaters/update-dependencies";
import { updateFiles } from "../updaters/update-files";
import { logger } from "utils/logger";
import { registryItemFileSchema } from "features/schema/schema";
import { isSafeTarget } from "utils/is-safe-target";
import { resolveRegistryTree } from "features/schema/resolve-registry-tree";
import { configWithDefaults } from "features/schema/config-with-defaults";

function validateFilesTarget(files: z.infer<typeof registryItemFileSchema>[], cwd: string) {
  for (const file of files) {
    if (!file?.target) {
      continue;
    }

    if (!isSafeTarget(file.target, cwd)) {
      throw new Error(`We found an unsafe file path "${file.target} in the registry item. Installation aborted.`);
    }
  }
}

export async function addProjectComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean;
    silent?: boolean;
    isNewProject?: boolean;
    baseStyle?: boolean;
  },
) {
  if (!options.baseStyle && !components.length) {
    return;
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start();
  const tree = await resolveRegistryTree(components, configWithDefaults(config));

  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch components from registry."));
  }

  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd);
  } catch (error) {
    registrySpinner?.fail();
    return handleError(error);
  }

  registrySpinner?.succeed();

  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent,
  });

  await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
  });

  if (tree.docs) {
    logger.info(tree.docs);
  }
}
