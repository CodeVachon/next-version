type IncValue = "Major" | "Minor" | "Patch";
interface ISettings {
    cwd: string;
    workingBranch: "main" | "master" | string;
    incValue: IncValue;
    createReleaseBranch: boolean;
    workspaces: string | string[];
}
