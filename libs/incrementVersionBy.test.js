const incrementVersionBy = require("./incrementVersionBy");

describe("incrementVersionBy", () => {
    const majorVersion = 4;
    const minorVersion = 6;
    const patchVersion = 8;
    const version = `${majorVersion}.${minorVersion}.${patchVersion}`;
    [
        {
            label: "Major",
            expect: `${majorVersion+1}.0.0`
        },
        {
            label: "Minor",
            expect: `${majorVersion}.${minorVersion+1}.0`
        },
        {
            label: "Patch",
            expect: `${majorVersion}.${minorVersion}.${patchVersion+1}`
        }
    ].forEach((testSet) => {
        [
            {
                label: "semantic",
                prefix: "",
                postfix: ""
            },
            {
                label: "pre-fixed semantic",
                prefix: "v",
                postfix: ""
            },
            {
                label: "post-fixed semantic",
                prefix: "",
                postfix: "-beta"
            }
        ].forEach((variation) => {
            const thisVersion = `${variation.prefix}${version}${variation.postfix}`;
            test(`increments the ${testSet.label} on ${variation.label} version ${thisVersion} correctly`, () => {
                expect(incrementVersionBy(thisVersion, testSet.label.toLowerCase())).toEqual(`${variation.prefix}${testSet.expect}${variation.postfix}`);
            });
        }); // close forEach(variation)
    }); // close forEach(testSet)
}); // close incrementVersionBy
