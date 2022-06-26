import { RequiredKeys } from "../types/helpers.types";
import { TextsOptions, PackageOption } from "../types/package.types";

export const defaultPackageOptions: RequiredKeys<Omit<PackageOption, "dir" | "entryPath" | "title">> = {
  logo: "",
  description: "",
  tsconfigName: "tsconfig.json",
  tsconfigDir: "",
  readmeName: "README.md",
  readmeDir: "",
};

export const defaultTextsOptions: RequiredKeys<TextsOptions> = {
  monorepoTitle: "Packages",
  monorepoDescription: "List of the available packages documentations.",
  reference: "References",
  methods: "Methods",
  parameters: "Parameters",
  typeDefinitions: "Type Definitions",
  example: "Examples",
  additionalSources: "Additional Sources",
  import: "Import",
  preview: "Preview",
  returns: "Returns a",
  deprecated: "This feature is deprecated and might be removed in future releases.",
  paramTableHeaders: ["Name", "Type", "Default Value", "Description"],
};
