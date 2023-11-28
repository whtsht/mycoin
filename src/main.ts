import { argv, exit } from "process";
import { wallet } from "./wallet/index.js";
import { miner } from "./miner/index.js";

function usage() {
    console.log("[Usage]\nyarn start ( wallet | miner ) <name> ");
}

async function main() {
    if (argv.length !== 4) {
        usage();
        exit(1);
    }

    switch (argv[2]) {
        case "miner":
            await miner(argv[3]);
            break;
        case "wallet":
            await wallet(argv[3]);
            break;
        default:
            usage();
            exit(1);
    }
}

main();
