import AdmonitionTypeNote from "@theme/Admonition/Type/Note";
import AdmonitionTypeTip from "@theme/Admonition/Type/Tip";
import AdmonitionTypeInfo from "@theme/Admonition/Type/Info";
import AdmonitionTypeWarning from "@theme/Admonition/Type/Warning";
import AdmonitionTypeDanger from "@theme/Admonition/Type/Danger";
import AdmonitionTypeCaution from "@theme/Admonition/Type/Caution";
import type AdmonitionTypes from "@theme/Admonition/Types";

import AdmonitionTypeLearn from "./Type/Learn";
import AdmonitionTypeSuccess from "./Type/Success";

const admonitionTypes: typeof AdmonitionTypes = {
  learn: AdmonitionTypeLearn,
  note: AdmonitionTypeNote,
  tip: AdmonitionTypeTip,
  info: AdmonitionTypeInfo,
  warning: AdmonitionTypeWarning,
  danger: AdmonitionTypeDanger,
};

// Undocumented legacy admonition type aliases
// Provide hardcoded/untranslated retrocompatible label
// See also https://github.com/facebook/docusaurus/issues/7767
const admonitionAliases: typeof AdmonitionTypes = {
  secondary: AdmonitionTypeLearn,
  important: AdmonitionTypeInfo,
  success: AdmonitionTypeSuccess,
  caution: AdmonitionTypeCaution,
};

// eslint-disable-next-line import/no-default-export
export default {
  ...admonitionTypes,
  ...admonitionAliases,
};
