/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-default-export */
declare module "*.svg?react" {
  import React = require("react");
  export default React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}
