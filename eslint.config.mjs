import * as effectEslint from "@effect/eslint-plugin"
import { defineConfig } from "eslint/config"
import perfectionist from "eslint-plugin-perfectionist"
import tseslint from "typescript-eslint"

const config = defineConfig({
  files: ["**/*.{ts,mts,cts}"],
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  },
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "inline-type-imports", prefer: "type-imports" }
    ],
    "@typescript-eslint/no-import-type-side-effects": "error"
  }
})

export default [
  {
ignores: [
    "**/dist",
    "**/build",
    "**/docs",
    "**/*.md"
  ]
  },
  ...config,
  ...effectEslint.configs.dprint,
  {
    files: ["**/*.{ts,mts,cts}"],
    ...perfectionist.configs["recommended-natural"]
  },
  {
    rules: {
      "no-fallthrough": "off",
      "no-irregular-whitespace": "off",
      "object-shorthand": "error",
      "prefer-destructuring": "off",

      "no-restricted-syntax": ["error", {
        selector:
          "CallExpression[callee.property.name='push'] > SpreadElement.arguments",
        message: "Do not use spread arguments in Array.push"
      }],

      "no-unused-vars": "off",
      "prefer-rest-params": "off",
      "prefer-spread": "off",

      "@effect/dprint": ["error", {
        config: {
          indentWidth: 2,
          lineWidth: 120,
          semiColons: "asi",
          quoteStyle: "alwaysDouble",
          trailingCommas: "never",
          operatorPosition: "maintain",
          "arrowFunction.useParentheses": "force"
        }
      }]
    }
  }
]