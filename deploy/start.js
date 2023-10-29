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

let redeployments = 0;

/** @type {NodeJS.Signals | number} */
const KILL_SIGNAL = "SIGTERM";

/** @type {ChildProcess | null} */
let childProcess = null;

/**
 * # Start the process
 * @param {object} param0
 * @param {string} param0.command
 * @param {string[] | string} param0.preflight
 * @param {string} param0.redeploy_file
 * @param {string | number} [param0.port]
 */
function startProcess({ command, preflight, redeploy_file, port }) {
    try {
        console.log("First Run ...");

        const runPreflight = preflightFn(preflight);

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

                    if (!preflight) {
                        console.log(
                            `${colors.FgRed}Error:${colors.Reset} No preflight included in config file. If you don't want to run any preflight command simply add an empty array.`
                        );
                        process.exit();
                    }

                    killChild(port).then((kill) => {
                        if (kill) {
                            childProcess = run(command);
                        } else {
                            process.exit();
                        }
                    });
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
        });

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

/**
 * ## Preflight Function
 * @param {string | number} [port]
 * @returns {Promise<boolean>}
 */
async function killChild(port) {
    if (!childProcess) return false;

    try {
        childProcess.kill(KILL_SIGNAL);
        const childProcessPID = childProcess.pid;
        try {
            if (childProcessPID) {
                if (process.platform.match(/linux/i)) {
                    execSync(`kill -9 ${childProcessPID}`);
                }
                if (process.platform.match(/win/i)) {
                    execSync(`taskkill /F /PID ${childProcessPID}`);
                }
            }
        } catch (error) {
            console.log(
                `${colors.FgYellow}WARNING:${colors.Reset} Process ${childProcessPID} couldn't be killed => ${error.message}`
            );
        }

        childProcess = null;

        // await new Promise((resolve) => {
        //     setTimeout(() => {
        //         resolve(true);
        //     }, 1000);
        // });

        // console.log("Child Process Killed?", childProcess.killed);

        // if (childProcess.killed) {
        //     return true;
        // } else {
        //     console.log(
        //         `${colors.FgYellow}WARNING:${colors.Reset} Child Process Not Killed`
        //     );

        //     console.log(childProcess);

        //     let killRetries = 0;

        //     while (!childProcess.killed) {
        //         console.log("Trying to Kill child =>", killRetries);
        //         killRetries++;

        //         childProcess.kill(KILL_SIGNAL);

        //         if (childProcess.killed) {
        //             return true;
        //             break;
        //         }

        //         if (killRetries > 20) {
        //             console.log(
        //                 `${colors.FgRed}Error:${colors.Reset} Child Process couldn't be killed!`
        //             );
        //             process.exit();
        //         }
        //     }
        // }

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
