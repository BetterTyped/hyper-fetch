declare module "*.svg?react" {
  import React = require("react");
  export default React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}
