#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const simpleGit = require("simple-git/promise")();
const path = require("path");
const fs = require("fs");
const extend = require("extend");

const incrementVersionBy = require("./libs/incrementVersionBy");
const suggestedBranchName = require("./libs/suggestedBranchName");

const stdout = (string, color, bigOut) => {
    if (bigOut) {
        string = figlet.textSync(string, {
            font: "Colossal"
        });
    }
    console.info(chalk.keyword(color || "orange")(string));
} // close stdout
const stdErr = (string) => {
    console.error(chalk.red("\n\nError\n=====\n\n") + string);
    process.exit(1);
} // close stdErr

const init = () => {
    stdout("Next", null, true);
    stdout("Version", null, true);
} // close init

const askAQuestion = async (options) => {
    const resultOfQustion = await inquirer.prompt([extend(false, {
        name: "answer"
    }, options)]);

    return resultOfQustion.answer;
} // close

const isGitClean = (status) => {
    let isClean = true;

    [
        "not_added",
        "conflicted",
        "created",
        "deleted",
        "modified",
        "renamed",
        "files",
        "staged"
    ].forEach(key => {
        if (
            !Array.isArray(status[key]) ||
            (status[key].length > 0)
        ) {
            isClean = false;
        }
    });

    return isClean;
} // close isGitClean

const readFile = (atPath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(atPath, "utf8", (error, contents) => {
            if (error) {
                reject(error);
            } else {
                if (/\.json$/i.test(atPath)) {
                    resolve(JSON.parse(contents));
                } else {
                    resolve(contents);
                }
            }
        });
    });
} // close readFile

const writeFile = (atPath, contents) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(atPath, contents, (error, ok) => {
            if (error) {
                reject(error);
            } else {
                resolve(ok);
            }
        });
    });
} // close writeFile

const updateFileset = (pkgFilePath, pkg, workingDir) => {
    stdout(`Update ${ chalk.yellow("package.json") }`);
    return writeFile(pkgFilePath, JSON.stringify(pkg, null, " ".repeat(2))).then(() => {
        // Do Other THings...
        // Like Change Log
        // Like VERSION File

        return new Promise((resolve, reject) => {
            fs.readdir(workingDir, (error, contents) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(contents);
                }
            });
        }).then(async (ls) => {
            const getFileName = (ls, pattern, options) => {
                return ls.filter(filename => new RegExp(pattern, options).test(filename.toLowerCase()));
            } // close getFileName
            const hasFile = (ls, pattern, options) => {
                return (getFileName(ls, pattern, options).length > 0);
            } // close hasFile

            if (hasFile(ls, "changelog(\.md)?")) {
                const newLine = "\r\n";
                const changelogFile = getFileName(ls, "changelog(\.md)?")[0];
                const changelogPath = `${workingDir}${path.sep}${changelogFile}`

                stdout(`Update ${chalk.yellow(changelogFile)}`);

                await readFile(changelogPath).then(contents => {
                    const updatedContents = contents.replace(/^((?:#\s)?[^\n\r]{1,}(?:\n|\r){1,}(?:={3,}(?:\n|\r){1,})?)/, `$1${ newLine.repeat(2) }## ${ pkg.version }${ newLine.repeat(1) }- ${ newLine.repeat(2) }`).replace(/(\n|\r){3,}/g, newLine.repeat(2));
                    return writeFile(changelogPath, updatedContents);
                });
            }
        });
    });
} // close updateFileset

const run = async () => {
    init();
    const pwd = await askAQuestion({
        type: "text",
        message: "What is the Directory Path to the project?",
        default: process.cwd()
    });
    const expectedWorkingBranch = await askAQuestion({
        type: "list",
        message: "What is the Default Branch for the project?",
        choices: ["main", "master"],
        default: "main"
    });
    const incValue = await askAQuestion({
        type: "list",
        message: "What would you like to increment?",
        choices: ["Major", "Minor", "Patch"],
        default: "Minor"
    });
    const createReleaseBranch = await askAQuestion({
        type: "confirm",
        message: "Would you like to auto-create and push a release branch?",
        default: true
    });

    try {
        await simpleGit.cwd(pwd);
    } catch(e) {
        stdErr(e.message);
    }

    const isRepo = await simpleGit.checkIsRepo();
    if (!isRepo) {
        stdErr(`invalid repository ${ pwd }. can not continue`);
    }

    const gitStatus = await simpleGit.status();

    if (!isGitClean(gitStatus)) {
        stdout(`Your current branch [${chalk.blue(gitStatus.current)}] is not clean.`);
        const shouldIResetHard = await askAQuestion({
            type: "confirm",
            message: `Would you like perform "git reset --hard"?`,
            default: false
        });

        if (shouldIResetHard) {
            stdout(`-- git reset --hard`);
            try {
                await simpleGit.reset("hard");
            } catch (e) {
                stdErr(e.message);
            }
        } else {
            stdErr(`git is dirty, can not continue`);
        }
    }

    if (gitStatus.current != expectedWorkingBranch) {
        stdout(`Your current branch is ${ chalk.red(gitStatus.current) }. expected ${ chalk.green(expectedWorkingBranch) }`);
        const shouldIChangeBranches = await askAQuestion({
            type: "confirm",
            message: `Would you Like to Change to the ${expectedWorkingBranch} branch?`,
            default: false
        });

        if (shouldIChangeBranches == true) {
            stdout(`-- git checkout ${expectedWorkingBranch}`);
            try {
                await simpleGit.checkout(expectedWorkingBranch);
            } catch (e) {
                stdErr(e.message);
            }
        } else {
            stdErr(`Can Not Complete Action on branch: ${gitStatus.current}`);
        }
    }

    stdout(`-- git pull`);
    try {
        await simpleGit.pull();
    } catch (e) {
        stdErr(e.message);
    }

    const thisPkgFile = `${pwd}${path.sep}package.json`;
    const thispkg = await readFile(thisPkgFile);
    const newVersion = incrementVersionBy(thispkg.version, incValue);

    stdout(`Change version from ${ chalk.red(thispkg.version) } to ${ chalk.green(newVersion) }`);
    thispkg.version = newVersion;

    if (createReleaseBranch) {
        // Set the Remote to Upload To
        let gitOrigin = "";
        const repoRemotes = await simpleGit.getRemotes();

        if (repoRemotes.length > 1) {
            gitOrigin = await askAQuestion({
                type: "list",
                message: `Which Origin would you like to use?`,
                choices: repoRemotes.map(remote => remote.name),
                default: repoRemotes[0].name
            });
        } else {
            gitOrigin = repoRemotes[0].name;
        }

        // Set the New Branch Name
        const newBranchName = await askAQuestion({
            message: "How should the new branch be named?",
            default: suggestedBranchName(incValue, newVersion)
        });

        stdout(`-- git checkout -b ${newBranchName}`);

        try {
            await simpleGit.checkoutBranch(newBranchName, expectedWorkingBranch);
        } catch(e) {
            stdErr(e.message);
        }

        // Update the Files
        await updateFileset(thisPkgFile, thispkg, pwd);

        // Add newly updated files
        try {
            const newStatus = await simpleGit.status();
            await simpleGit.add(newStatus.files.map(thisfile => {
                stdout(`-- git add ${thisfile.path}`);
                return thisfile.path
            }));
            stdout(`-- git commit -m "set version to ${newVersion} [next-version]"`);
            await simpleGit.commit(`set version to ${newVersion} [next-version]`);

            // Push to Remote
            stdout(`-- git push -u ${gitOrigin} ${newBranchName}`);
            await simpleGit.push(["-u", gitOrigin, newBranchName]);
        } catch (e) {
            stdErr(e.message);
        }
    } else {
        await updateFileset(thisPkgFile, thispkg, pwd);
    } // clsoe if (createReleaseBranch)

    stdout("\nSuccess!", "green");
} // close run

run();
