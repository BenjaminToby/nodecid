// @ts-check

const path = require("path");
const fs = require("fs");
const {
    execSync,
    spawnSync,
    spawn,
    execFile,
    execFileSync,
    ChildProcess,
} = require("child_process");
const colors = require("../utils/console-colors");

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

/**
 * # Start the process
 * @param {object} param0
 * @param {string} param0.command
 * @param {string[] | string} param0.preflight
 * @param {string} param0.redeploy_file
 */
function startProcess({ command, preflight, redeploy_file }) {
    /** @type {ChildProcess | null} */
    let childProcess = null;

    try {
        const runPreflight = preflightFn(preflight);

        if (!preflight) {
            process.exit();
        }

        childProcess = run(command);

        if (!childProcess) {
            console.log(
                `${colors.FgRed}Error:${colors.Reset} Process couldn't start. Exiting...`
            );
            process.exit();
        }
    } catch (/** @type {*} */ error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} First run failed! => ${error.message}`
        );
    }

    fs.watchFile(redeploy_file, { interval: 1000 }, (curr, prev) => {
        if (childProcess) {
            console.log("Rebuilding ...");

            try {
                const runPreflight = preflightFn(preflight);

                if (!preflight) {
                    process.exit();
                }
                childProcess.kill("SIGTERM");
            } catch (/** @type {*} */ error) {
                console.log(
                    `${colors.FgRed}Error:${colors.Reset} killing child processes => ${error.message}`
                );
            }

            childProcess = run(command);
        }
    });
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

/**
 * ## Preflight Function
 * @param {string} command
 * @returns {ChildProcess | null}
 */
function run(command) {
    const startCommandArray = command.split(" ").filter((str) => str.trim());

    try {
        const firstCommand = startCommandArray.shift()?.[0];

        if (!firstCommand) {
            throw new Error("No Starting Command Found in command string!");
        }

        let childProcess = spawn(firstCommand, ["server.js"], {
            cwd: process.cwd(),
            stdio: "inherit",
        });

        return childProcess;
    } catch (/** @type {*} */ error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} running start command => ${error.message}`
        );
        return null;
    }
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

/**
 * ## Preflight Function
 * @param {string[] | string} preflight
 * @returns {boolean}
 */
function preflightFn(preflight) {
    console.log("Preflight Running ...");

    /** @type {import("child_process").ExecSyncOptions} */
    const options = {
        cwd: process.cwd(),
        stdio: "inherit",
    };

    try {
        if (typeof preflight == "string") {
            execFileSync(preflight, options);
        } else if (typeof preflight == "object" && preflight?.[0]) {
            preflight.forEach((cmd) => execSync(cmd, options));
        }
        return true;
    } catch (error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} Preflight Failed! => ${error.message}`
        );
        return false;
    }
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

module.exports = startProcess;
