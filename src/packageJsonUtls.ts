import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

export const readPackageJson = (cwd: string) => {
    const packageJsonContent = readFileSync(resolve(cwd, "package.json"), "utf8");

    return packageJsonContent;
};

export const writePackageJson = (cwd: string, content: string) => {
    writeFileSync(resolve(cwd, "package.json"), content, {
        flag: "w"
    });
};
