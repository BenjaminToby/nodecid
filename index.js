#! /usr/bin/env node
// @ts-check

const fs = require("fs");
const path = require("path");
const colors = require("./utils/console-colors");
const startProcess = require("./deploy/start");

///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////

const WORK_DIR = process.cwd();

///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////

function run() {
    try {
        const configText = fs.readFileSync(
            path.join(WORK_DIR, "nodecid.config.json"),
            "utf-8"
        );

        /** @type {NodeCIConfig} */
        const config = JSON.parse(configText);

        const {
            start,
            preflight,
            postflight,
            build,
            redeploy_path,
            first_run,
            port,
        } = config;

        /** @type {string | undefined} */
        let redeployFile;

        if (!redeploy_path) {
            const defaultRedeployPath = path.join(WORK_DIR, "REDEPLOY");
            const checkExistingPath = fs.existsSync(defaultRedeployPath);

            if (!checkExistingPath) {
                fs.writeFileSync(
                    defaultRedeployPath,
                    Date.now().toString(),
                    "utf-8"
                );
            }

            redeployFile = path.join(WORK_DIR, "REDEPLOY");
        } else {
            redeployFile = path.resolve(WORK_DIR, redeploy_path);
        }

        if (!redeployFile) throw new Error("Redeploy file not found!");

        startProcess({
            command: start,
            preflight,
            redeploy_file: redeployFile,
            first_run,
            port,
            postflight,
        });
    } catch (error) {
        console.log(
            `${colors.FgRed}ERROR:${colors.Reset} CI process failed! => ${error.message}`
        );
    }
}

run();

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

process.on("exit", () => {
    console.log("Process exiting ...");
});

process.on("beforeExit", () => {
    console.log("Process Before exit ...");
});
