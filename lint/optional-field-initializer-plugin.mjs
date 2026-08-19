/**
 * Metro (React Native) compiles class properties in loose mode, which drops field
 * declarations that have no initializer. An instance bundled for mobile then never
 * owns the property, so `"field" in instance`, `Object.keys(instance)`, spreads,
 * and serialization dumps all disagree with what the class declared. The SDK proxy
 * crash fixed in core (sdk.ts / request.ts) came exactly from this.
 *
 * Optional class fields are the dangerous case: TS strictPropertyInitialization
 * already forces non-optional fields to be assigned in the constructor, but `?`
 * fields are allowed to stay unassigned forever. This rule requires an explicit
 * `= undefined` initializer on them, which every transpiler preserves.
 */
const requireOptionalFieldInitializer = {
  meta: {
    type: "problem",
    docs: {
      description: "Require `= undefined` on optional class fields so loose class-property transforms (Metro) keep them as own properties",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingInitializer:
        "Optional class field '{{name}}' has no initializer. Metro drops uninitialized class fields, so bundled instances never own it ('in' checks, spreads and dumps break). Add `= undefined`.",
    },
  },
  create(context) {
    const check = (node) => {
      if (!node.optional || node.value || node.declare) {
        return;
      }

      const name = node.key && node.key.name ? node.key.name : "unknown";
      const anchor = node.typeAnnotation ?? node.key;

      context.report({
        node,
        messageId: "missingInitializer",
        data: { name },
        fix: (fixer) => fixer.insertTextAfter(anchor, " = undefined"),
      });
    };

    return {
      PropertyDefinition: check,
    };
  },
};

export default {
  meta: { name: "hyper-fetch" },
  rules: {
    "require-optional-field-initializer": requireOptionalFieldInitializer,
  },
};
