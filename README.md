# Simple CI/CD package for any application

Integrate a simple CI/CD process into your application without the hassle.

_**NOTE:** This package needs `node` installed to work_

## Requirements

-   **Node JS Runtime and NPM:** You need to have `NodeJS` and `npm` installed on the target machine for this package to work.
-   **`nodecid.config.json` file:** This package depends on a configuration file located in the root directory of your application.

## Installation

To install this package globally just run:

```shell
npm install -g nodecid
```

To run the package directly run:

```shell
npx nodecid
```

This will download the package and run the binaries directly. After the first run it won't download the package again.

## Usage

To run the package after installing it globally just run:

```shell
nodecid
```

Remember you must have a `nodecid.config.json` file located in your root directory else this will throw an error.

### Configuration

Your `nodecid.config.json` file should look like this:

```json
{
    "start": "node index.js",
    "preflight": ["npm run test", "npm run build"]
}
```

or

```json
{
    "start": "node index.js",
    "preflight": "./preflight.sh"
}
```

Your `preflight` parameter can wither be an array of commands, or path to a shell script. This will run before every `start` commands.

Optionally you could include a `redeploy_path` in your config file:

```json
{
    "start": "node index.js",
    "preflight": "./preflight.sh",
    "redeploy_path": "./REDEPLOY"
}
```

This will look for the file named `REDEPLOY` in your rood directory and watch that file. If the file is changed the application will be restarted, ie it will run the `preflight` command(s) and `start` command. If you ommit the `redeploy_path` a file named `REDEPLOY` will be created in your root directory.

You can change the name and path of the `redeploy_path`, just make sure the path is correct and the file name exists in the named path. Example:

```json
{
    "start": "node index.js",
    "preflight": "./preflight.sh",
    "redeploy_path": "./deploy/trigger.txt"
}
```

_NOTE:_ This also works for other languages, example:

```json
{
    "start": "python app.py",
    "preflight": "./preflight.sh"
}
```

This app just runs whatever command you send it in an isolated child process, the command will be run as if being run in a terminal.

### Redeployment

For continuos deployment and integration there needs to be a text file located in your project which the application can watch. Any time the content of this file is changed the application will rebuild and rerun your `start` command.
