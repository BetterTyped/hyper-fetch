import { parse } from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { createRequire } from "node:module";

import {
  getUnexpectedGenerics,
  getEmptyGenerics,
  getNotMatchingGeneric,
  getTypeArguments,
} from "../../../src/utils/generic-utilities.types";

const require = createRequire(import.meta.url);
// typescript-eslint 7 is installed under an alias and sets both `typeArguments` and the old `typeParameters`.
const { parse: parseV7 } = require("typescript-eslint-parser-v7") as { parse: typeof parse };

const getCall = (program: TSESTree.Program): TSESTree.CallExpression => {
  const [statement] = program.body;
  if (statement.type !== "ExpressionStatement" || statement.expression.type !== "CallExpression") {
    throw new Error("Expected a call expression");
  }
  return statement.expression;
};

describe("Generic Utilities", () => {
  describe("getTypeArguments", () => {
    const code = "client.createRequest<{ response: User }>();";

    it("should read typeArguments from typescript-eslint 8", () => {
      const call = getCall(parse(code));

      expect("typeParameters" in call).toBe(false);
      expect(getTypeArguments(call)?.params[0].type).toBe("TSTypeLiteral");
    });

    it("should read typeArguments from typescript-eslint 7", () => {
      const call = getCall(parseV7(code));

      expect(getTypeArguments(call)?.params[0].type).toBe("TSTypeLiteral");
    });

    it("should fall back to typeParameters from parsers older than typescript-eslint 6", () => {
      const { typeArguments, ...call } = getCall(parse(code));
      const legacyCall: TSESTree.CallExpression & { typeParameters?: TSESTree.TSTypeParameterInstantiation } = {
        ...call,
        typeArguments: undefined,
        typeParameters: typeArguments,
      };

      expect(getTypeArguments(legacyCall)).toBe(typeArguments);
    });

    it("should return undefined for a call without generics", () => {
      expect(getTypeArguments(getCall(parse("client.createRequest();")))).toBeUndefined();
    });
  });

  describe("getUnexpectedGenerics", () => {
    it("should return empty array when no type parameters are provided", () => {
      const result = getUnexpectedGenerics({
        typeArguments: undefined,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual([]);
    });

    it("should return unexpected generic members", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSTypeLiteral",
            members: [
              {
                type: "TSPropertySignature",
                key: { type: "Identifier", name: "endpoint" },
              },
              {
                type: "TSPropertySignature",
                key: { type: "Identifier", name: "unexpectedProp" },
              },
            ],
          },
        ],
      };

      const result = getUnexpectedGenerics({
        typeArguments,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual(["unexpectedProp"]);
    });

    it("should handle non-object generic type", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSStringKeyword",
          },
        ],
      };

      const result = getUnexpectedGenerics({
        typeArguments,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual(["TSStringKeyword"]);
    });
  });

  describe("getEmptyGenerics", () => {
    it("should return false when no type parameters are provided", () => {
      const result = getEmptyGenerics({
        typeArguments: undefined,
      });

      expect(result).toBe(false);
    });

    it("should return true for empty generic object", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSTypeLiteral",
            members: [],
          },
        ],
      };

      const result = getEmptyGenerics({
        typeArguments,
      });

      expect(result).toBe(true);
    });

    it("should return false for non-empty generic object", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSTypeLiteral",
            members: [
              {
                type: "TSPropertySignature",
                key: { type: "Identifier", name: "endpoint" },
              },
            ],
          },
        ],
      };

      const result = getEmptyGenerics({
        typeArguments,
      });

      expect(result).toBe(false);
    });
  });

  describe("getNotMatchingGeneric", () => {
    it("should return false when no type parameters are provided", () => {
      const result = getNotMatchingGeneric({
        typeArguments: undefined,
      });

      expect(result).toBe(false);
    });

    it("should return false for object generic type", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSTypeLiteral",
            members: [
              {
                type: "TSPropertySignature",
                key: { type: "Identifier", name: "endpoint" },
              },
            ],
          },
        ],
      };

      const result = getNotMatchingGeneric({
        typeArguments,
      });

      expect(result).toBe(false);
    });

    it("should return true for non-object generic type", () => {
      const typeArguments: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSStringKeyword",
          },
        ],
      };

      const result = getNotMatchingGeneric({
        typeArguments,
      });

      expect(result).toBe(true);
    });
  });
});
