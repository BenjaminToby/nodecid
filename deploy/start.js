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
 * @param {string[] | string} [param0.postflight]
 * @param {string} param0.redeploy_file
 * @param {string | number | (string | number)[]} [param0.port] - The port to kill on rebuild
 * @param {boolean} [param0.first_run] - Whether to run the preflight on first run. Default `false`
 */
function startProcess({
    command,
    preflight,
    postflight,
    redeploy_file,
    port,
    first_run,
}) {
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

                                if (postflight) {
                                    const runPostflight = preflightFn(
                                        postflight,
                                        true
                                    );

                                    if (!runPostflight) {
                                        // TODO: Action to take if postflight fails

                                        console.log(
                                            `${colors.FgRed}Error:${colors.Reset} Postflight Failed.`
                                        );
                                    }
                                }
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
 * @param {boolean} [postflight]
 * @returns {boolean}
 */
function preflightFn(preflight, postflight) {
    const tag = postflight ? "Postflight" : "Preflight";
    console.log(`${tag} Running ...`);

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
                        `${colors.FgRed}Error:${colors.Reset} ${tag} command ${cmd} Failed! => ${error.message}`
                    );
                    return false;
                    break;
                }
            }
        }
        return true;
    } catch (error) {
        console.log(
            `${colors.FgRed}Error:${colors.Reset} ${tag} Failed! => ${error.message}`
        );
        return false;
    }
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

/**
 * ## Kill Child Process Function
 * @param {string | number | (string | number)[]} [port]
 * @returns {Promise<boolean>}
 */
async function killChild(port) {
    if (!childProcess) return false;

    try {
        const childProcessPID = childProcess.pid;
        childProcess.kill();

        if (typeof port == "object" && port?.[0]) {
            for (let i = 0; i < port.length; i++) {
                const singlePort = port[i];
                await kill(Number(singlePort));
            }
        } else if (port) {
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
