export type DevtoolsPluginOptions = {
  /**
   * Name of your application, it will be displayed in the Hyper Flow app
   */
  appName: string;
  /**
   * URL of the Hyper Flow server
   * Needed only if you change the default port in the Hyper Flow app
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
