import { _PKG_META, _PLUGIN_OPTS } from "../globals";
import { promises as pFs } from "fs";
import { JSONOutput } from "typedoc";
import { KindTypes } from "../md/md.constants";

export const _title = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const isJSONGenerated = async (): Promise<void> => {
  const notFoundDocs = [];
  //@ts-ignore
  for (const [packageName, metaData] of _PKG_META.entries()) {
    if (_PLUGIN_OPTS.readOnce) {
      if (!metaData.file) {
        notFoundDocs.push(packageName);
      }
    } else {
      try {
        await pFs.access(metaData.docPath);
      } catch {
        notFoundDocs.push(packageName);
      }
    }
  }

  if (notFoundDocs.length > 0) {
    throw Error(`Could not find docs for the following packages: ${notFoundDocs}`);
  }
};

export const getMatchingElement = (
  parsedApiJSON: JSONOutput.ProjectReflection,
  name: string,
  // @ts-ignore
): JSONOutput.DeclarationReflection => {
  const paramsConstraint = (elTag: KindTypes) => [KindTypes.class, KindTypes.fn, KindTypes.type].includes(elTag);
  // @ts-ignore
  for (const child of parsedApiJSON.children) {
    if (child.name === name) {
      // @ts-ignore
      if (!paramsConstraint(child.kindString)) {
        throw Error(`Cannot show params for type ${child.kindString} for ${child.name}`);
      }

      return child;
    }
  }
};
