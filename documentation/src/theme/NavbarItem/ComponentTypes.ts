import ComponentTypes from "@theme-original/NavbarItem/ComponentTypes";
import { RainbowButton } from "@site/src/components/ui/rainbow-button";
import { GitHubStarButton } from "@site/src/components/star-button/star-button";

// eslint-disable-next-line import/no-default-export
export default {
  ...ComponentTypes,
  "custom-myButton": RainbowButton,
  "custom-githubStarButton": GitHubStarButton,
};
