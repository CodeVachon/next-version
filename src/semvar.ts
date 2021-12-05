export class SemVar {
    currentValue: {
        Major: number;
        Minor: number;
        Patch: number;
    } = {
        Major: 0,
        Minor: 0,
        Patch: 0
    };

    constructor(current: string) {
        if (current) {
            this.set(current);
        }
    }

    set(value: string) {
        const [Major = 0, Minor = 0, Patch = 0] = value.split(".").map((v) => parseInt(v));

        this.currentValue = {
            Major,
            Minor,
            Patch
        };

        return this;
    }

    inc(section: IncValue) {
        const current = { ...this.currentValue };

        current[section]++;

        return [current.Major, current.Minor, current.Patch].join(".");
    }

    dec(section: IncValue) {
        const current = { ...this.currentValue };

        current[section]--;

        return [current.Major, current.Minor, current.Patch].join(".");
    }
}
