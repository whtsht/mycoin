import { SendResult, Transaction } from "../miner/index.js";
import fs from "node:fs";
import { JSONPreset } from "lowdb/node";
import { config, input, integer, list } from "../inputUtility.js";

type Wallet = {
    name: string;
    nodePortNumber: number;
};

const walletPath = (name: string) => `./wallets/${name}.json`;

const getDB = (name: string) =>
    JSONPreset<Wallet>(walletPath(name), {
        name,
        nodePortNumber: null,
    });

async function init(name: string) {
    const port = await integer(
        "Specify the full node port number",
        "Please enter a number",
    );

    const db = await getDB(name);
    db.data.nodePortNumber = port;
    await db.write();

    console.log(`Wallet initialization completed on ${walletPath(name)}`);
}

async function transactions(port: number) {
    if (port) {
        const response = await fetch(`http://localhost:${port}/transactions`);

        const transactions = (await response.json()) as Transaction[];

        console.log(transactions);
    } else {
        console.log(
            "Node port number is not set.\nSet the port number using `node run wallet set-port <name> <number>`",
        );
    }
}

async function send(name: string, port: number) {
    const to = await input("Who do you send CT to?");

    const amount = await integer(
        "How many CTs will you send?",
        "Please enter a integer",
    );

    const transaction = { from: name, to, amount };

    const response = await fetch(`http://localhost:${port}/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
    });

    const result = (await response.json()) as SendResult;

    if (result === "OK") {
        console.log("send");
    } else {
        console.log(`${result.errorMessage}`);
    }
}

type Operation = "Show Transactions" | "Send CT" | "Quit";

export async function wallet(name: string) {
    if (!fs.existsSync(walletPath(name))) {
        const newWallet = await config(
            "I don't have my wallet. Do you want to make a new one?",
            true,
        );

        if (newWallet) {
            await init(name);
        } else {
            console.log("See you again 👋");
            return;
        }
    }

    const db = await getDB(name);
    const { nodePortNumber: port } = db.data;

    for (;;) {
        const operation = (await list("What are you doing?", [
            "Show Transactions",
            "Send CT",
            "Quit",
        ])) as Operation;

        switch (operation) {
            case "Show Transactions":
                await transactions(port);
                break;
            case "Send CT":
                await send(name, port);
                break;
            case "Quit":
                console.log("See you again 👋");
                return;
        }
    }
}
