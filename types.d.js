/**
 * @typedef {object} NodeCIConfig
 * @property {string} start - Start command. Eg `node index.js`
 * @property {string[] | string} preflight - And array of commands to run before
 * the application starts, or a single `.sh` file path.
 * @property {string[] | string} [postflight] - And array of commands to run after
 * the application starts.
 * @property {string} [redeploy_path] - The path to the file that will trigger a
 * redeployment if content is changed. Default file path is `./REDEPLOY`
 * @property {boolean} [first_run] - Whether to run the preflight on first run. Default `false`
 * @property {string | number | (string | number)[]} [port] - The port to kill on reload
 * @property {NodeCIBuild} [build] - Build configurations
 */

/**
 * @typedef {object} NodeCIBuild
 * @property {"Next.JS" | "Remix"} paradigm - The paradigm to build on
 * @property {string} [out_dir] - The output Directory. Default `.dist`.
 */
