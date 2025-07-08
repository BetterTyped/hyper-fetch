/* eslint-disable func-names */
/* eslint-disable object-shorthand */
/* eslint-disable no-console */
import type { CookieConsentConfig } from "vanilla-cookieconsent";

export const pluginConfig: CookieConsentConfig = {
  root: "#cookieconsent",
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom right",
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      position: "left",
      equalWeightButtons: true,
      flipButtons: false,
    },
  },

  categories: {
    necessary: {
      readOnly: true,
      enabled: true,
    },
    analytics: {
      autoClear: {
        cookies: [
          {
            name: /^(_ga|_gid|codesandbox_.*)/,
          },
        ],
      },
    },
  },

  language: {
    default: "en",

    translations: {
      en: {
        consentModal: {
          title: "Cookie Usage on HyperFetch Documentation",
          description:
            'Our documentation uses tracking cookies to improve your experience and analyze usage patterns, particularly in our interactive CodeSandbox examples. <a href="#privacy-policy" data-cc="show-preferencesModal" class="cc__link">Manage preferences</a>',
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Only necessary",
          showPreferencesBtn: "Manage preferences",
          footer: `
            <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/Code_of_Conduct.md" target="_blank" rel="noopener">Privacy Policy</a>
            <a href="https://github.com/BetterTyped/hyper-fetch" target="_blank" rel="noopener">GitHub</a>
          `,
        },
        preferencesModal: {
          title: "Cookie preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Only necessary",
          savePreferencesBtn: "Save preferences",
          closeIconLabel: "Close",
          sections: [
            {
              title: "Cookie Usage",
              description:
                'We use cookies to ensure the basic functionalities of the HyperFetch documentation and to enhance your learning experience, especially in our interactive CodeSandbox examples. You can choose for each category to opt-in/out whenever you want. For more details, please read our <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/Code_of_Conduct.md" class="cc__link" target="_blank" rel="noopener">Code of Conduct and Privacy guidelines</a>.',
            },
            {
              title: "Strictly necessary cookies",
              description:
                "These cookies are essential for the documentation site to function properly, including navigation, authentication, and basic functionality.",
              linkedCategory: "necessary",
            },
            {
              title: "Analytics and Performance cookies",
              description:
                "These cookies help us understand how you interact with our documentation and CodeSandbox examples, allowing us to improve the user experience.",
              linkedCategory: "analytics",
              cookieTable: {
                headers: {
                  name: "Name",
                  domain: "Service",
                  description: "Description",
                  expiration: "Expiration",
                },
                body: [
                  {
                    name: "_ga",
                    domain: "Google Analytics",
                    description:
                      'Cookie set by <a href="https://analytics.google.com" target="_blank" rel="noopener">Google Analytics</a> to track page views and user interactions.',
                    expiration: "2 years",
                  },
                  {
                    name: "_gid",
                    domain: "Google Analytics",
                    description:
                      'Cookie set by <a href="https://analytics.google.com" target="_blank" rel="noopener">Google Analytics</a> to distinguish users.',
                    expiration: "24 hours",
                  },
                  {
                    name: "codesandbox_*",
                    domain: "CodeSandbox",
                    description:
                      "Cookies set by embedded CodeSandbox examples to maintain state and provide interactive functionality.",
                    expiration: "Session",
                  },
                ],
              },
            },
            {
              title: "More information",
              description:
                'For any questions about our cookie policy or data handling practices, please <a class="cc__link" href="https://github.com/BetterTyped/hyper-fetch/issues" target="_blank" rel="noopener">open an issue on GitHub</a> or contact the maintainers.',
            },
          ],
        },
      },
    },
  },
};
