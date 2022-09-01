import { SemVar } from "./semvar";

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};
const selectRandom = <T>(recordSet: T[], notRecord: T): T => {
    const thisRecordSet = recordSet.filter((r) => JSON.stringify(r) !== JSON.stringify(notRecord));

    return thisRecordSet[getRandomInt(0, thisRecordSet.length)];
};

describe("SemVar", () => {
    describe("constructor", () => {
        test("builds", () => {
            const instance = new SemVar();

            expect(instance).toBeInstanceOf(SemVar);
        });

        test("accepts and sets a current version", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];
            const instance = new SemVar(value.join("."));

            expect(instance).toBeInstanceOf(SemVar);
            expect(instance.currentValue).toMatchObject({
                Major: value[0],
                Minor: value[1],
                Patch: value[2]
            });
        });

        test("accepts and sets a current formatted version", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];
            const instance = new SemVar(`Release-v${value.join(".")}`);

            expect(instance).toBeInstanceOf(SemVar);
            expect(instance.currentValue).toMatchObject({
                Major: value[0],
                Minor: value[1],
                Patch: value[2]
            });
        });
    });

    describe("set", () => {
        test("accepts and sets a current version", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];

            const result = new SemVar().set(value.join("."));

            expect(result.currentValue).toMatchObject({
                Major: value[0],
                Minor: value[1],
                Patch: value[2]
            });
        });

        test("accepts and sets a current formatted version", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];

            const result = new SemVar().set(`Release-v${value.join(".")}`);

            expect(result.currentValue).toMatchObject({
                Major: value[0],
                Minor: value[1],
                Patch: value[2]
            });
        });
    });

    describe("inc", () => {
        test("correctly sets major", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];
            const newValue = new SemVar(value.join(".")).inc("Major");

            expect(newValue).toEqual([value[0] + 1, 0, 0].join("."));
        });
        test("correctly sets minor", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];
            const newValue = new SemVar(value.join(".")).inc("Minor");

            expect(newValue).toEqual([value[0], value[1] + 1, 0].join("."));
        });
        test("correctly sets patch", () => {
            const value = [getRandomInt(0, 30), getRandomInt(0, 30), getRandomInt(0, 30)];
            const newValue = new SemVar(value.join(".")).inc("Patch");

            expect(newValue).toEqual([value[0], value[1], value[2] + 1].join("."));
        });
    });

    describe("dec", () => {
        test("correctly sets major", () => {
            const value = [getRandomInt(1, 30), getRandomInt(1, 30), getRandomInt(1, 30)];
            const newValue = new SemVar(value.join(".")).dec("Major");

            expect(newValue).toEqual([value[0] - 1, 0, 0].join("."));
        });
        test("correctly sets minor", () => {
            const value = [getRandomInt(1, 30), getRandomInt(1, 30), getRandomInt(1, 30)];
            const newValue = new SemVar(value.join(".")).dec("Minor");

            expect(newValue).toEqual([value[0], value[1] - 1, 0].join("."));
        });
        test("correctly sets patch", () => {
            const value = [getRandomInt(1, 30), getRandomInt(1, 30), getRandomInt(1, 30)];
            const newValue = new SemVar(value.join(".")).dec("Patch");

            expect(newValue).toEqual([value[0], value[1], value[2] - 1].join("."));
        });
    });
});
