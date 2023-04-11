import figlet from "figlet";
import chalk from "chalk";
import inquirer from "inquirer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { GitAPI } from "./GitApi";
import { askAQuestion } from "./askAQuestion";
import { COLOR } from "./color";
import { log } from "./log";
import { readPackageJson, writePackageJson } from "./packageJsonUtls";
import { SemVar } from "./semvar";
import glob from "glob";
import { parse } from "yaml";
import fs from "node:fs";
import path from "node:path";

const validIncValues: IncValue[] = ["Major", "Minor", "Patch"];
const yargsOptions: Record<string, yargs.Options> = {
    cwd: {
        type: "string",
        alias: "c",
        describe: "Working Directory"
    },
    createReleaseBranch: {
        type: "boolean",
        alias: "p",
        describe: "Push the Release Branch"
    },
    workingBranch: {
        type: "string",
        alias: "b",
        describe: "The Working Branch",
        choices: ["main", "master"]
    },
    incValue: {
        type: "string",
        alias: "i",
        describe: "value to increment",
        choices: validIncValues
    },
    workspaces: {
        type: "string",
        alias: "w",
        describe: "Work Spaces",
        default: []
    }
};

const preRun = async (): Promise<Readonly<ISettings>> =>
    new Promise(async (resolve, reject) => {
        console.info();
        console.info();
        console.info(
            chalk.hex(COLOR.ORANGE)(
                figlet.textSync("Next", {
                    font: "Colossal"
                })
            )
        );
        console.info(
            chalk.hex(COLOR.ORANGE)(
                figlet.textSync("Version", {
                    font: "Colossal"
                })
            )
        );
        console.info();

        const args: ISettings = (await yargs(hideBin(process.argv)).options(yargsOptions)
            .argv) as unknown as ISettings;

        const settings: ISettings = (await inquirer.prompt(
            [
                {
                    name: "cwd",
                    type: "text",
                    message: "What is the Directory Path to the project?",
                    default: process.cwd()
                },
                {
                    name: "workingBranch",
                    type: "list",
                    message: "What is the Default Branch for the project?",
                    choices: async ({ cwd }: { cwd: string }) => {
                        const git = new GitAPI({ cwd });
                        const branches = await git.branchList();

                        const filterList = branches.filter(
                            (v) =>
                                !new RegExp("^(release|patch|feature|fix|hot-?fix|bug)", "i").test(
                                    v
                                )
                        );

                        filterList.sort((a) => {
                            if (new RegExp("(main|master|production)").test(a)) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });

                        return filterList;
                    }
                },
                {
                    name: "incValue",
                    type: "list",
                    message: "What would you like to increment?",
                    choices: validIncValues,
                    default: "Minor" as IncValue
                },
                {
                    name: "createReleaseBranch",
                    type: "confirm",
                    message: "Would you like to auto-create and push a release branch?"
                }
            ],
            args
        )) as ISettings;

        const workspaceFiles = await glob("./pnpm-workspace.yaml", { cwd: settings.cwd });
        if (workspaceFiles.length > 0) {
            const workspaceSettings = parse(
                fs.readFileSync(path.resolve(settings.cwd, workspaceFiles[0]), "utf-8")
            );

            settings.workspaces = await askAQuestion({
                name: "useWorkspaces",
                type: "checkbox",
                message: "We detected a workspace, which folders would you like to increment?",
                choices: workspaceSettings.packages.map((v: string) =>
                    String(v).replace(new RegExp("\\/\\*$"), "")
                )
            });
        }

        const logKeys = ["cwd", "incValue", "workingBranch", "workspaces"];
        const maxLength = logKeys.reduce((v, current) => {
            if (current.length > v) {
                return current.length;
            } else {
                return v;
            }
        }, 0);
        console.info();
        logKeys.forEach((key) => {
            log(
                `${key.padEnd(maxLength)}   ${chalk.hex(COLOR.CYAN)(
                    settings[key as keyof typeof settings]
                )}`
            );
        });

        resolve(Object.freeze(settings));
    });

const main = async (settings: Readonly<ISettings>): Promise<string | void> => {
    // console.log({ settings });

    const git = new GitAPI({ cwd: settings.cwd, verbose: true });

    // Check Dirty State
    console.info();
    log("Check for dirty state");
    if (await git.isDirty()) {
        console.info();
        const resetHard = await askAQuestion({
            message: "Repository is Dirty! would you like to perform a HARD RESET?",
            type: "confirm",
            default: false
        });

        if (resetHard) {
            await git.call("reset --hard");
        } else {
            return Promise.resolve("Can not continue on a dirty branch");
        }
    }

    // Change Branch
    console.info();
    log(`Checkout branch ${chalk.hex(COLOR.CYAN)(settings.workingBranch)}`);
    const currentBranch = await git.currentBranch();
    if (currentBranch !== settings.workingBranch) {
        await git.checkout(settings.workingBranch);
    }
    await git.pull();

    console.info();
    log(`Read ${chalk.hex(COLOR.CYAN)("package.json")}`);
    const pkgText = await readPackageJson(settings.cwd);
    const pkg = JSON.parse(pkgText);
    log(`Current version: ${chalk.red(pkg.version)}`);

    const newVersion = new SemVar(pkg.version).inc(settings.incValue);
    log(`New version:     ${chalk.green(newVersion)}`);

    console.info();
    const newBranchName = `${settings.incValue === "Patch" ? "Patch" : "Release"}-v${newVersion}`;
    log(`Create Release Branch: ${chalk.hex(COLOR.CYAN)(newBranchName)}`);

    const currentBranches = await git.branchList();
    if (currentBranches.some((branch) => branch === newBranchName)) {
        log(`A Branch named ${chalk.hex(COLOR.CYAN)(newBranchName)} already exists. Exiting`);
        process.exit(0);
    }
    await git.checkout(newBranchName, true);

    console.info();
    log(`Update ${chalk.hex(COLOR.CYAN)("package.json")}`);
    const newPkgText = pkgText.replace(`"version": "${pkg.version}"`, `"version": "${newVersion}"`);
    writePackageJson(settings.cwd, newPkgText);
    await git.add("package.json");

    for (const workspace of settings.workspaces instanceof Array
        ? settings.workspaces
        : [settings.workspaces]) {
        console.info();
        log(`Checking Workspace: ${chalk.hex(COLOR.CYAN)(workspace)}`);
        const workspaceFiles = await glob(`./${workspace}/**/package.json`, {
            ignore: ["node_modules/**", "./**/node_modules/**"],
            cwd: settings.cwd
        }).then((results) =>
            results.filter((result) => !new RegExp("node_modules", "gi").test(result))
        );

        if (workspaceFiles.length === 0) {
            log(
                `No ${chalk.hex(COLOR.ORANGE)(
                    "package.json"
                )} files found in Workspace: ${chalk.hex(COLOR.CYAN)(workspace)}`
            );
        } else {
            log(
                `${workspaceFiles.length} ${chalk.hex(COLOR.ORANGE)(
                    "package.json"
                )} files found in Workspace: ${chalk.hex(COLOR.CYAN)(workspace)}`
            );
            for (const fileName of workspaceFiles) {
                console.info();
                log(`Update ${chalk.hex(COLOR.CYAN)(fileName)}`);
                const app_pkgFileName = settings.cwd + "/" + fileName;
                const app_pkgText = await readPackageJson(app_pkgFileName);
                const app_pkg = JSON.parse(app_pkgText);

                const newAppPkgText = app_pkgText.replace(
                    `"version": "${app_pkg.version}"`,
                    `"version": "${newVersion}"`
                );
                writePackageJson(app_pkgFileName, newAppPkgText);

                await git.add(fileName);
            }
        }
    }

    console.info();
    log("Commit Changes");
    await git.commit(`Version ${newVersion} [Next Version]`);

    if (settings.createReleaseBranch) {
        console.info();
        log(`Push ${chalk.hex(COLOR.CYAN)(newBranchName)}`);
        const remotes = await git.getRemotes();

        let useRemote = "origin";
        if (remotes.length > 1) {
            useRemote = await askAQuestion({
                type: "list",
                message: "Which Remote would you like to push too?",
                choices: remotes
            });
        } else {
            useRemote = remotes[0];
        }

        await git.push(useRemote);
    }

    return Promise.resolve();
};

/**
 * Execute the Application
 */
preRun()
    .then(main)
    .then((result = "Work Complete!") => {
        console.info();
        log(result);
        console.info();
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
