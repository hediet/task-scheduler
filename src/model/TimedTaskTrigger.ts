import { Integer, literal, union, nullType, Type, type, Errors } from "io-ts";
import { DateFromISOString } from "io-ts-types";
import {
    SimpleTimeSequence,
    TimeSequence,
    RelativeTimeSequence,
    SingleTimeSequence,
    SimpleRelativeTimeSequence,
    EmptyTimeSequence,
    EmptyRelativeTimeSequence
} from "./TimeSequence";
import { ZonedDateTime, convert, LocalDate, nativeJs } from "js-joda";
import { right, left, Either } from "fp-ts/lib/Either";

export const SimpleTimeInterval = type({
    seconds: Integer,
    minutes: Integer,
    hours: Integer,
    days: Integer,
    months: Integer
});

export const TimedTaskTriggerBase = type({
    kind: literal("TimeBased"),
    start: DateFromISOString,
    repeat: union([SimpleTimeInterval, nullType]),
    runtime: union([SimpleTimeInterval, nullType])
});

export const TimedTaskTrigger = new Type<
    TimedTaskTrigger,
    typeof TimedTaskTriggerBase._O,
    unknown
>(
    "TimedTaskTrigger",
    (x): x is TimedTaskTrigger => {
        throw new Error("Not supported");
    },
    (i, ctx) => {
        const r = TimedTaskTriggerBase.decode(i);
        if (r.isLeft()) {
            return left(r.value);
        }

        if (r.isRight()) {
            const start = ZonedDateTime.from(nativeJs(r.value.start));
            const runtime = r.value.runtime;
            const interval = r.value.repeat;
            return right({
                kind: "TimeBased",
                time: interval
                    ? new SimpleTimeSequence(start, interval)
                    : new SingleTimeSequence(start),
                runtime: runtime
                    ? new SimpleRelativeTimeSequence(runtime)
                    : new EmptyRelativeTimeSequence()
            } as TimedTaskTrigger);
        }

        throw new Error("Impossible");
    },
    i => {
        let start: Date;
        let repeat: typeof SimpleTimeInterval._A | null;
        if (i.time instanceof SimpleTimeSequence) {
            repeat = {
                seconds: i.time.interval.seconds || 0,
                minutes: i.time.interval.minutes || 0,
                hours: i.time.interval.hours || 0,
                days: i.time.interval.days || 0,
                months: i.time.interval.months || 0
            };
            start = convert(i.time.start).toDate();
        } else if (i.time instanceof SingleTimeSequence) {
            repeat = null;
            start = convert(i.time.start).toDate();
        } else {
            throw new Error("Unknown time sequence: " + i.time.toString());
        }

        let runtime: typeof SimpleTimeInterval._A | null;
        if (i.runtime instanceof SimpleRelativeTimeSequence) {
            runtime = {
                seconds: i.runtime.interval.seconds || 0,
                minutes: i.runtime.interval.minutes || 0,
                hours: i.runtime.interval.hours || 0,
                days: i.runtime.interval.days || 0,
                months: i.runtime.interval.months || 0
            };
            start = convert(i.time.start).toDate();
        } else if (i.runtime instanceof EmptyRelativeTimeSequence) {
            runtime = null;
        } else {
            throw new Error("Unknown time sequence");
        }

        return TimedTaskTriggerBase.encode({
            kind: i.kind,
            repeat,
            runtime,
            start
        });
    }
);

export interface TimedTaskTrigger {
    kind: "TimeBased";
    time: TimeSequence;
    runtime: RelativeTimeSequence;
}
