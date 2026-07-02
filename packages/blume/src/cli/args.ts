import { logger } from "./log.ts";

const MAX_PORT = 65_535;

/**
 * Parse a `--port` value into a valid port number, or `undefined` when unset.
 * A non-integer or out-of-range value (`--port abc` → `NaN`) exits with an
 * error rather than propagating `localhost:NaN` into the dev server and the
 * `deployment.site` fallback.
 */
export const parsePort = (value?: string): number | undefined => {
  if (value === undefined) {
    return;
  }
  const port = Number(value);
  if (!(Number.isInteger(port) && port >= 1 && port <= MAX_PORT)) {
    logger.error(
      `Invalid --port "${value}" (expected an integer 1-${MAX_PORT}).`
    );
    process.exit(1);
  }
  return port;
};
