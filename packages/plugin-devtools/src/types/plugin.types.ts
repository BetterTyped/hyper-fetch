export type DevtoolsPluginOptions = {
  /**
   * Name of your application, it will be displayed in the HyperFlow app
   */
  appName: string;
  /**
   * URL of the HyperFlow server
   * Needed only if you change the default port in the HyperFlow app
   * @default "ws://localhost:2137"
   */
  url?: string;
  /**
   * Enable debug mode logs, so you can see what's happening in plugin
   * @default false
   */
  debug?: boolean;
  /**
   * App environment indication
   *
   * */
  environment?: string;
};
