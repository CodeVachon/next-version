import figlet from "figlet";
import chalk from "chalk";
import inquirer from "inquirer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { GitAPI } from "./GitApi";
import { askAQuestion } from "./askAQuestion";
import { COLOR } from "./color";
import { logCmd, log } from "./log";

type IncValue = "Major" | "Minor" | "Patch";
interface ISettings {
    cwd: string;
    workingBranch: "main" | "master" | string;
    incValue: IncValue;
    createReleaseBranch: boolean;
}

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

                        return branches.filter(
                            (v) =>
                                !new RegExp("^(release|patch|feature|fix|hot-?fix|bug)", "i").test(
                                    v
                                )
                        );
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

    // TODO: Read PKG.JSON to get current Version Number

    // TODO: Increment Version Number

    // TODO: Create Release Branch

    // TODO: UPDATE Verson Number in PKG.JSON

    // TODO: COMMIT AND PUSH  (IF REQURIED TO PUSH)

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
