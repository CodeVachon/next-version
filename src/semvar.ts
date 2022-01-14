interface ISemVarCurrentValue {
    Major: number;
    Minor: number;
    Patch: number;
}

export class SemVar {
    currentValue: ISemVarCurrentValue = {
        Major: 0,
        Minor: 0,
        Patch: 0
    };

    constructor(current?: string) {
        if (current) {
            this.set(current);
        }
    }

    set(value: string) {
        const semVarPattern = new RegExp("[0-9]{1,}\\.[0-9]{1,}\\.[0-9]{1,}", "gi");
        const cleaned = String(value).match(semVarPattern);

        if (cleaned === null || cleaned?.length === 0) {
            throw new Error(
                `Invalid SemVar Value Passed. Got "${value}". Expected Matching ${semVarPattern}`
            );
        }

        const [Major = 0, Minor = 0, Patch = 0] = String(cleaned[0])
            .split(".")
            .map((v) => Number(v));

        this.currentValue = {
            Major,
            Minor,
            Patch
        };

        return this;
    }

    private adjustVersionForIncrementValue(current: ISemVarCurrentValue, section: IncValue) {
        if (section === "Major") {
            current.Minor = 0;
            current.Patch = 0;
        } else if (section === "Minor") {
            current.Patch = 0;
        }

        return current;
    }

    inc(section: IncValue) {
        let current = { ...this.currentValue };

        current[section]++;

        current = this.adjustVersionForIncrementValue(current, section);

        return [current.Major, current.Minor, current.Patch].join(".");
    }

    dec(section: IncValue) {
        let current = { ...this.currentValue };

        current[section]--;

        current = this.adjustVersionForIncrementValue(current, section);

        return [current.Major, current.Minor, current.Patch].join(".");
    }
}
