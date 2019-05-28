module.exports = suggestedBranchName = (incValue, version) => {
    let suggestedBranchName = "";
    if (incValue.toLowerCase() == "patch") {
        suggestedBranchName = "Patch-";
    } else {
        suggestedBranchName = "Release-";
    }
    if (/[0-9]/.test(version[0])) {
        suggestedBranchName += "v";
    }
    suggestedBranchName += version;

    return suggestedBranchName;
}; // close suggestedBranchName
