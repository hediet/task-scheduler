import { Disposable, DisposableLike, dispose } from "@hediet/std/disposable";

/**
 * Finds the smallest `t` so that `test(t) && !test(t - 1)`
 * @param test A monotonous function,
 * i.e. `forall e >= 0: test(t) <= test(t + e)`.
 */
export function binarySearch(test: (t: number) => boolean): number {
    let range = [-1, 1];
    while (test(range[0])) {
        // At this point, we know that `t < range[0]`
        range = [range[0] * 2, range[0]];
    }
    // now we have `!test(range[0])` and `range[1] != 1 => test(range[1])`

    while (!test(range[1])) {
        // At this point, we know that `range[1] < t`
        range = [range[1], range[1] * 2];
    }

    // now we have `!test(range[0]) && test(range[1])`

    // [t1, t2]
    while (true) {
        const mid = Math.floor((range[1] + range[0]) / 2);
        if (test(mid)) {
            if (mid == range[1]) {
                return mid;
            }
            range = [range[0], mid];
        } else {
            if (mid == range[0]) {
                return mid + 1;
            }
            range = [mid, range[1]];
        }
    }
}

export class Disposer implements Disposable {
    private disposables = new Set<Disposable>();

    public track<T extends DisposableLike>(disposable: T): T {
        for (const d of Disposable.normalize(disposable)) {
            this.disposables.add(d);
        }
        return disposable;
    }

    public untrack<T extends DisposableLike>(disposable: T): T {
        for (const d of Disposable.normalize(disposable)) {
            this.disposables.delete(d);
        }
        return disposable;
    }

    public isDisposed = false;

    public readonly dispose = () => {
        this.isDisposed = true;
        dispose(this.disposables);
        this.disposables.clear();
    };
}
