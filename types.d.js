/**
 * @typedef {object} NodeCIConfig
 * @property {string} start - Start command. Eg `node index.js`
 * @property {string[] | string} preflight - And array of commands to run before
 * the application starts, or a single `.sh` file path.
 * @property {string} [redeploy_path] - The path to the file that will trigger a
 * redeployment if content is changed. Default file path is `./REDEPLOY`
 * @property {boolean} [first_run] - Whether to run the preflight on first run. Default `false`
 * @property {string | number} [port] - The port to kill on reload
 */
