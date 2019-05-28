module.exports = incrementVersionBy = (currentVersion, incrementValue) => {
    const cleanVersion = currentVersion.replace(/[^0-9\.]{1,}/g, "");

    const prefix = currentVersion.replace(new RegExp(`(\w{0,})${cleanVersion}.{0,}`), "$1");
    const postfix = currentVersion.replace(new RegExp(`.{0,}${cleanVersion}(\w{0,})`), "$1");

    const versionSplit = cleanVersion.split(".");

    switch (incrementValue.toLowerCase()) {
        case "major":
            versionSplit[0]++;
            versionSplit[1] = 0;
            versionSplit[2] = 0;
            break;
        case "minor":
            versionSplit[1]++;
            versionSplit[2] = 0;
            break;
        case "patch":
            versionSplit[2]++;
            break;
    } // close switch (incrementValue.toLowerCase())

    return prefix + versionSplit.join(".") + postfix;
} // close incrementVersionBy
