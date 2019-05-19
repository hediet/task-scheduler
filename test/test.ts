import { expect } from "chai";
import { SimpleTimeSequence } from "../src/model/TimeSequence";
import { ZonedDateTime, ZoneId } from "js-joda";

describe("TimeSequence", () => {
    it("should work", async () => {
        const start = ZonedDateTime.of(2019, 10, 5, 10, 0, 0, 0, ZoneId.UTC);
        const next = (t: number) => start.plusSeconds(t).plusDays(t);

        const seq = new SimpleTimeSequence(start, {
            days: 1,
            seconds: 1
        });
        expect(seq.getFirstTime()!.toString()).to.equal(start.toString());
        const next1 = seq.getNextTime(start)!;
        expect(seq.getNextTime(next1.minusMinutes(1))!.toString()).to.equal(
            next1.toString()
        );
        expect(seq.getNextTime(next1.minusDays(1))!.toString()).to.equal(
            next1.toString()
        );
        expect(next1.toString()).to.equal(next(1).toString());

        const next2 = seq.getNextTime(next1)!;
        expect(next2.toString()).to.equal(next(2).toString());

        const next3 = seq.getNextTime(next2)!;
        expect(next3.toString()).to.equal(next(3).toString());

        for (let i = 0; i < 40; i++) {
            const someTime = ZonedDateTime.of(
                2125,
                10,
                5,
                10,
                0,
                0,
                0,
                ZoneId.UTC
            );
            expect(seq.getNextTime(someTime)!.toString()).to.equal(
                next(38716).toString()
            );
        }
    });
});
