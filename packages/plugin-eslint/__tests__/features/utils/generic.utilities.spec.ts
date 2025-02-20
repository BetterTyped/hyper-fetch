import {
  getUnexpectedGenerics,
  getEmptyGenerics,
  getNotMatchingGeneric,
} from "../../../src/utils/generic-utilities.types";

describe("Generic Utilities", () => {
  describe("getUnexpectedGenerics", () => {
    it("should return empty array when no type parameters are provided", () => {
      const result = getUnexpectedGenerics({
        typeParameters: undefined,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual([]);
    });

    it("should return unexpected generic members", () => {
      const typeParameters: any = {
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
        typeParameters,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual(["unexpectedProp"]);
    });

    it("should handle non-object generic type", () => {
      const typeParameters: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSStringKeyword",
          },
        ],
      };

      const result = getUnexpectedGenerics({
        typeParameters,
        allowedGenerics: ["endpoint", "headers"],
      });

      expect(result).toEqual(["TSStringKeyword"]);
    });
  });

  describe("getEmptyGenerics", () => {
    it("should return false when no type parameters are provided", () => {
      const result = getEmptyGenerics({
        typeParameters: undefined,
      });

      expect(result).toBe(false);
    });

    it("should return true for empty generic object", () => {
      const typeParameters: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSTypeLiteral",
            members: [],
          },
        ],
      };

      const result = getEmptyGenerics({
        typeParameters,
      });

      expect(result).toBe(true);
    });

    it("should return false for non-empty generic object", () => {
      const typeParameters: any = {
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
        typeParameters,
      });

      expect(result).toBe(false);
    });
  });

  describe("getNotMatchingGeneric", () => {
    it("should return false when no type parameters are provided", () => {
      const result = getNotMatchingGeneric({
        typeParameters: undefined,
      });

      expect(result).toBe(false);
    });

    it("should return false for object generic type", () => {
      const typeParameters: any = {
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
        typeParameters,
      });

      expect(result).toBe(false);
    });

    it("should return true for non-object generic type", () => {
      const typeParameters: any = {
        type: "TSTypeParameterInstantiation",
        params: [
          {
            type: "TSStringKeyword",
          },
        ],
      };

      const result = getNotMatchingGeneric({
        typeParameters,
      });

      expect(result).toBe(true);
    });
  });
});
