#!/usr/bin/env node
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

// ************************************************************
// # Basic usage
// node ./scripts/update-package-version.js
// ************************************************************

// ************************************************************
// # With options
// node ./scripts/update-package-version.js --prefix "v" --dry-run
// ************************************************************

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  // Ensure both arrays have same length by padding with 0s
  const maxLength = Math.max(parts1.length, parts2.length);
  while (parts1.length < maxLength) parts1.push(0);
  while (parts2.length < maxLength) parts2.push(0);

  for (let i = 0; i < maxLength; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

/**
 * Extract version from git tag
 * @param {string} tag - Git tag (e.g., "v1.2.3", "release-2.0.1")
 * @param {string} prefix - Prefix to remove (e.g., "v", "release-")
 * @returns {string|null} - Extracted version or null if invalid
 */
function extractVersion(tag, prefix) {
  if (!tag.startsWith(prefix)) return null;

  const version = tag.substring(prefix.length);

  // Basic semver validation (major.minor.patch with optional pre-release)
  const semverRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-.]+)?$/;

  if (!semverRegex.test(version)) return null;

  return version;
}

/**
 * Get all git tags with the specified prefix
 * @param {string} prefix - Tag prefix to filter by
 * @returns {string[]} - Array of version strings
 */
function getGitTags(prefix) {
  try {
    const isWindows = process.platform === "win32";

    // Fetch tags first (needed for CI environments)
    execSync("git fetch --tags", {
      stdio: "pipe",
      ...(isWindows ? { shell: true } : {}),
    });

    // Get all tags sorted by version (descending)
    const output = execSync("git tag --sort=-version:refname", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...(isWindows ? { shell: true } : {}),
    });

    const tags = output
      .trim()
      .split("\n")
      .filter((tag) => tag.trim() !== "");

    const versions = [];

    tags.forEach((tag) => {
      const version = extractVersion(tag, prefix);
      if (version) {
        versions.push(version);
      }
    });

    return versions;
  } catch (error) {
    console.error("Error getting git tags:", error.message);
    return [];
  }
}

/**
 * Find the latest version from an array of version strings
 * @param {string[]} versions - Array of version strings
 * @returns {string|null} - Latest version or null if no versions
 */
function getLatestVersion(versions) {
  if (versions.length === 0) return null;

  let latest = versions[0];

  for (let i = 1; i < versions.length; i++) {
    if (compareVersions(versions[i], latest) > 0) {
      latest = versions[i];
    }
  }

  return latest;
}

/**
 * Update package.json version
 * @param {string} newVersion - New version to set
 * @param {string} packagePath - Path to package.json
 */
function updatePackageVersion(newVersion, packagePath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const oldVersion = packageJson.version;

    packageJson.version = newVersion;

    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

    console.log(`✅ Updated package.json version: ${oldVersion} → ${newVersion}`);
  } catch (error) {
    console.error("Error updating package.json:", error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // Default configuration
  let prefix = "v";
  let packagePath = path.join(process.cwd(), "package.json");
  let dryRun = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--prefix" && i + 1 < args.length) {
      prefix = args[i + 1];
      i++;
    } else if (arg === "--package" && i + 1 < args.length) {
      packagePath = args[i + 1];
      i++;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: node update-package-version.js [options]

Options:
  --prefix <prefix>    Tag prefix to filter by (default: "v")
  --package <path>     Path to package.json (default: "./package.json")
  --dry-run           Show what would be updated without making changes
  --help, -h          Show this help message

Examples:
  node update-package-version.js
  node update-package-version.js --prefix "release-"
  node update-package-version.js --prefix "v" --package "./packages/core/package.json"
  node update-package-version.js --dry-run
      `);
      return;
    }
  }

  console.log(`🔍 Looking for git tags with prefix: "${prefix}"`);

  // Check if package.json exists
  if (!fs.existsSync(packagePath)) {
    console.error(`❌ Package.json not found at: ${packagePath}`);
    process.exit(1);
  }

  // Get git tags
  const versions = getGitTags(prefix);

  if (versions.length === 0) {
    console.log(`❌ No git tags found with prefix "${prefix}"`);
    process.exit(1);
  }

  console.log(
    `📋 Found ${versions.length} version tags:`,
    versions.slice(0, 10).join(", ") + (versions.length > 10 ? "..." : ""),
  );

  // Get latest version
  const latestVersion = getLatestVersion(versions);

  if (!latestVersion) {
    console.log("❌ Could not determine latest version");
    process.exit(1);
  }

  console.log(`🚀 Latest version found: ${latestVersion}`);

  // Read current package.json version
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const currentVersion = packageJson.version;

    console.log(`📦 Current package.json version: ${currentVersion}`);

    if (currentVersion === latestVersion) {
      console.log("✅ Package.json is already up to date!");
      return;
    }

    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would update version: ${currentVersion} → ${latestVersion}`);
      return;
    }

    // Update package.json
    updatePackageVersion(latestVersion, packagePath);
  } catch (error) {
    console.error("Error reading package.json:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module && process.env.NODE_ENV === "production") {
  main();
}
