module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 11,
    ecmaFeatures: {
      jsx: true,
    },
    project: ["./tsconfig.json", "./packages/*/tsconfig.json", "./documentation/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "src/", "__tests__/"],
      },
    },
    react: {
      pragma: "React",
      version: "detect",
    },
  },

  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
      plugins: ["react", "react-hooks", "eslint-plugin-prettier"],
      extends: [
        "eslint:recommended",
        "plugin:react-hooks/recommended",
        "prettier",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/typescript",
        "airbnb",
        "airbnb-typescript",
        "plugin:prettier/recommended",
      ],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "react/prop-types": "off",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "no-console": ["error", { allow: ["warn", "error"] }],
        "react/react-in-jsx-scope": "off",
        "no-continue": "off",
        "react/display-name": 0,
        "import/no-extraneous-dependencies": 0,
        "import/prefer-default-export": 0,
        "import/no-cycle": 0,
        "import/no-default-export": ["error"],
        "max-lines": ["error", 800],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/lines-between-class-members": "off",
        "prettier/prettier": ["error"],
        "consistent-return": 0,
        "@typescript-eslint/no-throw-literal": 0,
        "no-underscore-dangle": 0,
        "react/jsx-props-no-spreading": 0,
        "react/function-component-definition": 0,
        "react/require-default-props": 0,
        "spaced-comment": 0,
        "@typescript-eslint/ban-types": [
          "error",
          {
            extendDefaults: true,
            types: {
              "{}": false,
            },
          },
        ],
        "testing-library/render-result-naming-convention": "off",
        "max-params": ["error", 3],
        "no-param-reassign": [
          "error",
          {
            props: true,
            ignorePropertyModificationsFor: ["draft", "acc"],
          },
        ],
        "import/order": [
          "error",
          {
            groups: [
              ["builtin", "external"],
              ["internal", "parent", "sibling", "index"],
            ],
            pathGroups: [
              { pattern: "assets/**", group: "sibling", position: "after" },
              {
                pattern: "*.style{s,x}",
                group: "sibling",
                patternOptions: { matchBase: true },
                position: "after",
              },
            ],
            warnOnUnassignedImports: true,
            pathGroupsExcludedImportTypes: ["css"],
            "newlines-between": "always",
          },
        ],
      },
    },
    {
      files: ["*.spec.ts", "*.spec.tsx", "*.spec.js", "*.spec.jsx"],
      env: {
        jest: true,
      },
      rules: {
        "max-lines": "off",
      },
    },
    {
      files: ["*.mdx"],
      rules: {
        "react/jsx-filename-extension": "off",
        "react/jsx-no-undef": "off",
      },
    },
    {
      files: ["*.md", "*.mdx"],
      extends: "plugin:mdx/recommended",
      globals: {
        Head: "readonly",
        details: "readonly",
        Details: "readonly",
        code: "readonly",
        a: "readonly",
        pre: "readonly",
        ul: "readonly",
        li: "readonly",
        img: "readonly",
        h1: "readonly",
        h2: "readonly",
        h3: "readonly",
        h4: "readonly",
        h5: "readonly",
        h6: "readonly",
        admonition: "readonly",
        mermaid: "readonly",
        TabItem: "readonly",
        Tabs: "readonly",
        // Custom components
        LinkCard: "readonly",
        ShowMore: "readonly",
      },
    },
  ],
};
