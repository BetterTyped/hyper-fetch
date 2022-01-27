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
  reference: "Reference",
  methods: "Methods",
  parameters: "Parameters",
  typeDefinitions: "Type Definitions",
  example: "Example",
  additionalLinks: "Additional Links",
  import: "Import",
  returns: "Returns a ",
  paramTableHeaders: ["Name", "Type", "Default Value", "Description"],
};
