module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "src/"],
      },
    },
    react: {
      pragma: "React",
      version: "detect",
    },
  },
  plugins: ["react", "@typescript-eslint", "react-hooks"],
  extends: [
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
    "no-unused-vars": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react/no-unescaped-entities": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "react/display-name": 0,
    "import/no-extraneous-dependencies": 0,
    "import/prefer-default-export": 0,
    "prettier/prettier": ["error"],
  },
  parserOptions: {
    files: ["*.ts", "*.tsx"],
    project: ["./tsconfig.json"],
  },
  ignorePatterns: [".eslintrc.js"],
};
