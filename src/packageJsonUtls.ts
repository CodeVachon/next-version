import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const fixCWD = (cwd: string) => String(cwd).replace(new RegExp("package\\.json$", "i"), "");

export const readPackageJson = (cwd: string) => {
    const packageJsonContent = readFileSync(resolve(fixCWD(cwd), "package.json"), "utf8");

    return packageJsonContent;
};

export const writePackageJson = (cwd: string, content: string) => {
    writeFileSync(resolve(fixCWD(cwd), "package.json"), content, {
        flag: "w"
    });
};
