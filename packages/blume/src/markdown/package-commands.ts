/** Supported package managers, in the order tabs are displayed. */
export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** Words that mark the input as an explicit command rather than a bare list. */
const MANAGER_PREFIXES = new Set(["bun", "bunx", "npm", "npx", "pnpm", "yarn"]);

const WHITESPACE = /\s+/u;
const WHITESPACE_RUN = /\s+/gu;
const GLOBAL_FLAGS = new Set(["-g", "--global"]);

type Operation =
  | "add"
  | "ci"
  | "create"
  | "exec"
  | "install"
  | "remove"
  | "run";

interface Intent {
  args: string[];
  operation: Operation;
}

/** Map a package-manager subcommand to a normalized operation. */
const normalizeVerb = (verb: string): Operation | null => {
  switch (verb) {
    case "add":
    case "i":
    case "in":
    case "install": {
      return "add";
    }
    case "ci": {
      return "ci";
    }
    case "create":
    case "init": {
      return "create";
    }
    case "dlx":
    case "exec":
    case "x": {
      return "exec";
    }
    case "remove":
    case "rm":
    case "un":
    case "uninstall": {
      return "remove";
    }
    case "run": {
      return "run";
    }
    default: {
      return null;
    }
  }
};

/** Normalize npm-style flags to forms every manager understands. */
const normalizeFlags = (args: string[]): string[] =>
  args.flatMap((arg) => {
    if (arg === "--save-dev") {
      return ["-D"];
    }
    if (arg === "--save" || arg === "-S") {
      return [];
    }
    return [arg];
  });

/**
 * Parse an input command (a bare package list like `react react-dom` or an
 * explicit command like `npm i -D typescript` / `npx astro add`) into a
 * manager-agnostic intent.
 */
const parseIntent = (input: string): Intent => {
  const tokens = input.trim().split(WHITESPACE).filter(Boolean);
  if (tokens.length === 0) {
    return { args: [], operation: "install" };
  }

  const [first, ...rest] = tokens;
  if (first === undefined) {
    return { args: [], operation: "install" };
  }
  if (!MANAGER_PREFIXES.has(first)) {
    return { args: normalizeFlags(tokens), operation: "add" };
  }
  if (first === "npx" || first === "bunx") {
    return { args: rest, operation: "exec" };
  }

  const [verb, ...verbArgs] = rest;
  if (!verb) {
    return { args: [], operation: "install" };
  }
  // Yarn Classic spells global installs `yarn global <add|remove> …`; map it
  // onto the flag-style intent so every manager renders its own global form
  // instead of falling into the run-as-script branch.
  if (first === "yarn" && verb === "global") {
    const [globalVerb, ...globalArgs] = verbArgs;
    const globalOp = globalVerb ? normalizeVerb(globalVerb) : null;
    if (globalOp === "add" || globalOp === "remove") {
      return {
        args: [...normalizeFlags(globalArgs), "-g"],
        operation: globalOp,
      };
    }
  }
  const operation = normalizeVerb(verb);
  if (operation === null) {
    // Unknown subcommand (e.g. `npm test`); run it as a script.
    return { args: rest, operation: "run" };
  }
  if (operation === "add" && verbArgs.length === 0) {
    return { args: [], operation: "install" };
  }
  return { args: normalizeFlags(verbArgs), operation };
};

/** Render one manager's command for the given intent. */
const buildCommand = (manager: PackageManager, intent: Intent): string => {
  const args = intent.args.join(" ");
  switch (intent.operation) {
    case "add": {
      if (manager === "npm") {
        return `npm install ${args}`;
      }
      if (manager === "yarn" && intent.args.some((a) => GLOBAL_FLAGS.has(a))) {
        const pkgs = intent.args.filter((a) => !GLOBAL_FLAGS.has(a)).join(" ");
        return `yarn global add ${pkgs}`;
      }
      return `${manager} add ${args}`;
    }
    case "create": {
      return `${manager} create ${args}`;
    }
    case "exec": {
      if (manager === "npm") {
        return `npx ${args}`;
      }
      if (manager === "bun") {
        return `bunx ${args}`;
      }
      return `${manager} dlx ${args}`;
    }
    case "ci": {
      // `npm ci` maps to a frozen, lockfile-faithful install elsewhere. Yarn
      // Berry's flag is `--immutable` (`--frozen-lockfile` was removed in
      // Yarn 4), matching the Berry-only `yarn dlx` the `exec` case emits.
      if (manager === "npm") {
        return "npm ci";
      }
      if (manager === "yarn") {
        return "yarn install --immutable";
      }
      return `${manager} install --frozen-lockfile`;
    }
    case "remove": {
      if (manager === "npm") {
        return `npm uninstall ${args}`;
      }
      // Yarn Classic has no `remove -g`; the global form is `yarn global remove`.
      if (manager === "yarn" && intent.args.some((a) => GLOBAL_FLAGS.has(a))) {
        const pkgs = intent.args.filter((a) => !GLOBAL_FLAGS.has(a)).join(" ");
        return `yarn global remove ${pkgs}`;
      }
      return `${manager} remove ${args}`;
    }
    case "run": {
      return `${manager} run ${args}`;
    }
    default: {
      return `${manager} install`;
    }
  }
};

/**
 * Convert an install command into the equivalent for every supported package
 * manager. Accepts a bare package list (`react`) or a full command
 * (`npm i -D typescript`, `npx astro add react`).
 */
export const toPackageCommands = (
  input: string
): Record<PackageManager, string> => {
  const intent = parseIntent(input);
  const normalize = (command: string): string =>
    command.replaceAll(WHITESPACE_RUN, " ").trim();
  return {
    bun: normalize(buildCommand("bun", intent)),
    npm: normalize(buildCommand("npm", intent)),
    pnpm: normalize(buildCommand("pnpm", intent)),
    yarn: normalize(buildCommand("yarn", intent)),
  };
};
