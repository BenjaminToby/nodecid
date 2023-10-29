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

try {
    const configText = fs.readFileSync(
        path.join(WORK_DIR, "nodecid.config.json"),
        "utf-8"
    );

    /** @type {NodeCIConfig} */
    const config = JSON.parse(configText);

    const { start, preflight, redeploy_path } = config;

    /** @type {string | undefined} */
    let redeployFile;

    if (!redeploy_path) {
        fs.writeFileSync(
            path.join(WORK_DIR, "REDEPLY"),
            Date.now().toString(),
            "utf-8"
        );

        redeployFile = path.join(WORK_DIR, "REDEPLY");
    } else {
        redeployFile = path.resolve(WORK_DIR, redeploy_path);
    }

    if (!redeployFile) throw new Error("Redeploy file not found!");

    startProcess({
        command: start,
        preflight,
        redeploy_file: redeployFile,
    });
} catch (error) {
    console.log(
        `${colors.FgRed}ERROR:${colors.Reset} CI process failed! => ${error.message}`
    );
}
