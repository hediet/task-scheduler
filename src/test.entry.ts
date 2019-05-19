import { wait } from "@hediet/std/timer";

async function main(): Promise<void> {
    let i = 0;
    while (true) {
        console.log("bar" + i++);
        await wait(500);
    }
}

main();
