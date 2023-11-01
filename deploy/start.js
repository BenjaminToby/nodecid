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
const kill = require("kill-port");

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

let redeployments = 0;

/** @type {NodeJS.Signals | number} */
const KILL_SIGNAL = "SIGTERM";
// const KILL_SIGNAL = "SIGINT";

/** @type {ChildProcess | null} */
let childProcess = null;

const pTitle = "nodecid";
process.title = pTitle;

/**
 * # Start the process
 * @param {object} param0
 * @param {string} param0.command
 * @param {string[] | string} param0.preflight
 * @param {string} param0.redeploy_file
 * @param {string | number} [param0.port] - The port to kill on rebuild
 * @param {boolean} [param0.first_run] - Whether to run the preflight on first run. Default `false`
 */
function startProcess({ command, preflight, redeploy_file, port, first_run }) {
    try {
        if (first_run) {
            console.log("First Run ...");
            const runPreflight = preflightFn(preflight);
        }

        if (!preflight) {
            console.log(
                `${colors.FgRed}Error:${colors.Reset} No preflight included in config file. If you don't want to run any preflight command simply add an empty array.`
            );
            process.exit();
        }

        childProcess = run(command);

        if (!childProcess) {
            console.log(
                `${colors.FgRed}Error:${colors.Reset} Process couldn't start. Exiting...`
            );
            process.exit();
        }

        console.log("Watching", redeploy_file);

        fs.watchFile(redeploy_file, { interval: 100 }, (curr, prev) => {
            console.log(`${colors.BgBlue}File Changed${colors.Reset}`);

            if (redeployments == 0) return;

            if (childProcess) {
                console.log("******************************");
                console.log(
                    `******** ${colors.FgBlue}Rebuilding ${colors.FgMagenta}${redeployments}${colors.Reset} ********`
                );
                console.log("******************************");

                try {
                    const runPreflight = preflightFn(preflight);

                    if (!runPreflight) {
                        // TODO: Action to take if preflight fails

                        console.log(
                            `${colors.FgRed}Error:${colors.Reset} Preflight Failed.`
                        );
                    } else {
                        killChild(port).then((kill) => {
                            if (kill) {
                                childProcess = run(command);
                            } else {
                                process.exit();
                            }
                        });
                    }
                } catch (/** @type {*} */ error) {
                    console.log(
                        `${colors.FgRed}Error:${colors.Reset} killing child processes => ${error.message}`
                    );
                    process.exit();
                }
            }
        });
    } catch (/** @type {*} */ error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} First run failed! => ${error.message}`
        );
    }
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
    console.log("\n******************************");
    console.log(
        `****** ${colors.FgGreen}Starting App ...${colors.Reset} ******`
    );
    console.log("******************************\n");

    const startCommandArray = command.split(" ").filter((str) => str.trim());

    try {
        const firstCommand = startCommandArray.shift();

        if (!firstCommand) {
            throw new Error("No Starting Command Found in command string!");
        }

        let childProcess = spawn(firstCommand, startCommandArray, {
            stdio: "inherit",
            killSignal: KILL_SIGNAL,
        });

        // let childProcess = execSync(command, {
        //     stdio: "inherit",
        // });

        redeployments++;

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
            for (let i = 0; i < preflight.length; i++) {
                const cmd = preflight[i];
                try {
                    const execCmd = execSync(cmd, options);
                } catch (error) {
                    console.log(
                        `${colors.FgRed}Error:${colors.Reset} Preflight command ${cmd} Failed! => ${error.message}`
                    );
                    return false;
                    break;
                }
            }
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

/**
 * ## Kill Child Process Function
 * @param {string | number} [port]
 * @returns {Promise<boolean>}
 */
async function killChild(port) {
    if (!childProcess) return false;

    try {
        const childProcessPID = childProcess.pid;
        childProcess.kill();

        if (port) {
            await kill(Number(port));
        }

        return true;
    } catch (error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} Child Process couldn't be killed! ${error.message}`
        );
        return false;
    }
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

module.exports = startProcess;
