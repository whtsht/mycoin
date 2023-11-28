import { JSONPreset } from "lowdb/node";
import express from "express";
import fs from "node:fs";
import bodyParser from "body-parser";
import { config, integer } from "../inputUtility.js";
import * as transactions from "./transactions.js";
import * as send from "./send.js";

export type Transaction = {
    from: string;
    to: string;
    amount: number;
};

export type SendResult = "OK" | { errorMessage: string };

type MinerConfig = { portNumber: number };

export type Data = {
    config: MinerConfig;
    transactions: Transaction[];
};

export type Route = (
    req: express.Request,
    res: express.Response,
) => Promise<void>;

const minerPath = (name: string) => `./miners/${name}.json`;

const getDB = (name: string) =>
    JSONPreset<Data>(minerPath(name), {
        config: { portNumber: 0 },
        transactions: [{ from: "__network__", to: "Risa", amount: 100 }],
    });

async function createNewDB(name: string) {
    const port = await integer(
        "Specify the full node port number",
        "Please enter a number (0 ~ 65535)",
    );

    const db = await getDB(name);
    db.data.config.portNumber = port;
    await db.write();

    console.log(`Wallet initialization completed on ${minerPath(name)}`);
}

async function initDB(name: string) {
    if (!fs.existsSync(minerPath(name))) {
        const newMiner = await config(
            "You are not registered. Would you like to register a new one?",
            true,
        );

        if (newMiner) {
            await createNewDB(name);
        } else {
            console.log("See you again 👋");
            return;
        }
    }
}

export async function miner(name: string) {
    await initDB(name);

    const db = await getDB(name);
    const port = db.data.config.portNumber;

    const app = express();
    const jsonParser = bodyParser.json();

    // {} => Transaction[]
    app.get("/transactions", transactions.route(db));

    // Transaction => SendResult
    app.post("/send", jsonParser, send.route(db));

    app.listen(port, () => {
        console.log(`Start on port ${port}.`);
    });
}
