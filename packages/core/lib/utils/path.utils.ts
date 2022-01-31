// Based on the react router matcher
export const matchPath = (path: string, caseSensitive = false, end = true): [RegExp, string[]] => {
  if (path === "*" || !path.endsWith("*") || path.endsWith("/*")) {
    console.warn(
      "[matchPath]",
      `Route path "${path}" will be treated as if it were ` +
        `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
        `always follow a \`/\` in the pattern. To get rid of this warning, ` +
        `please change the route path to "${path.replace(/\*$/, "/*")}".`,
    );
  }

  const paramNames: string[] = [];
  let regexpSource = `^${path
    .replace(/\/*\*?$/, "") // Ignore trailing / and /*, we'll handle it below
    .replace(/^\/*/, "/") // Make sure it has a leading /
    .replace(/[\\.*+^$?{}|()[\]]/g, "\\$&") // Escape special regex chars
    .replace(/:(\w+)/g, (_: string, paramName: string) => {
      paramNames.push(paramName);
      return "([^\\/]+)";
    })}`;

  if (path.endsWith("*")) {
    paramNames.push("*");
    regexpSource +=
      path === "*" || path === "/*"
        ? "(.*)$" // Already matched the initial /, just match the rest
        : "(?:\\/(.+)|\\/*)$"; // Don't include the / in params["*"]
  } else {
    regexpSource += end
      ? "\\/*$" // When matching to the end, ignore trailing slashes
      : // Otherwise, match a word boundary or a proceeding /. The word boundary restricts
        // parent routes to matching only their own words and nothing more, e.g. parent
        // route "/home" should not match "/home2".
        "(?:\\b|\\/|$)";
  }

  const matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");

  return [matcher, paramNames];
};
