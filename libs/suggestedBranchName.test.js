const suggestedBranchName = require("./suggestedBranchName");

describe("suggestedBranchName", () => {
    const version = "0.0.0";
    [
        {
            incValue: "Major",
            expected: `Release-v`
        },
        {
            incValue: "Minor",
            expected: `Release-v`
        },
        {
            incValue: "Patch",
            expected: `Patch-v`
        }
    ].forEach(testSet => {
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

            test(`returns the correct value for ${testSet.incValue} with ${thisVersion}`, () => {
                expect(suggestedBranchName(testSet.incValue, thisVersion)).toEqual(testSet.expected + version + variation.postfix);
            });
        });
    })
});