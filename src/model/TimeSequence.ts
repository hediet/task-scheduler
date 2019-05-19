import { ZonedDateTime } from "js-joda";
import { binarySearch } from "../utils";

export interface RelativeTimeSequence {
    getTimeSequence(start: ZonedDateTime): TimeSequence;
}

export class EmptyRelativeTimeSequence implements RelativeTimeSequence {
    getTimeSequence(start: ZonedDateTime): TimeSequence {
        return new EmptyTimeSequence();
    }
}

export abstract class TimeSequence {
    /**
     * Gets a date time that is greater than `current`.
     * ```ts
     * assert(getNextTime(start, current)? > current);
     * ```
     * ```ts
     * require(c1 <= c2 < getNextTime(start, c1))
     * assert(getNextTime(start, c1) == getNextTime(start, c2));
     * ```
     */
    public abstract getNextTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined;

    public getFirstTime(): ZonedDateTime | undefined {
        return this.getNextTime(undefined);
    }

    public getLastTime(): ZonedDateTime | undefined {
        return this.getPreviousTime(undefined);
    }

    public abstract getPreviousTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined;

    public isIn(
        startExclusive: ZonedDateTime,
        endInclusive: ZonedDateTime
    ): boolean {
        const t = this.getNextTime(startExclusive);
        if (!t) {
            return false;
        }

        return t < endInclusive;
    }
}

export class EmptyTimeSequence extends TimeSequence {
    public getNextTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        return undefined;
    }

    public getPreviousTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        return undefined;
    }
}

export class SingleTimeSequence extends TimeSequence {
    constructor(public readonly start: ZonedDateTime) {
        super();
    }

    public getNextTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        if (!current || current.isBefore(this.start)) {
            return this.start;
        }
        return undefined;
    }

    public getPreviousTime(
        current: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        if (!current || current.isAfter(this.start)) {
            return this.start;
        }
        return undefined;
    }
}

export interface SimpleTimeInterval {
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
    months?: number;
}

export class SimpleRelativeTimeSequence implements RelativeTimeSequence {
    constructor(public readonly interval: SimpleTimeInterval) {}

    getTimeSequence(start: ZonedDateTime): TimeSequence {
        return new SimpleTimeSequence(start, this.interval);
    }
}

export class SimpleTimeSequence extends TimeSequence {
    constructor(
        public readonly start: ZonedDateTime,
        public readonly interval: SimpleTimeInterval
    ) {
        super();
    }

    private getTime(t: number): ZonedDateTime {
        let s = this.start;
        s = s.plusMonths((this.interval.months || 0) * t);
        s = s.plusDays((this.interval.days || 0) * t);
        s = s.plusHours((this.interval.hours || 0) * t);
        s = s.plusMinutes((this.interval.minutes || 0) * t);
        s = s.plusSeconds((this.interval.seconds || 0) * t);
        return s;
    }

    public getNextTime(
        after: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        if (!after || this.start.isAfter(after)) {
            return this.start;
        }

        const t = binarySearch(t => this.getTime(t).isAfter(after));
        if (t < 0) {
            throw new Error("Bug");
        }
        return this.getTime(t);
    }

    public getPreviousTime(
        before: ZonedDateTime | undefined
    ): ZonedDateTime | undefined {
        if (!before || !this.start.isBefore(before)) {
            return undefined;
        }

        const t = binarySearch(t => !this.getTime(t).isBefore(before));
        if (t < 0) {
            throw new Error("Bug");
        }
        return this.getTime(t - 1);
    }
}
