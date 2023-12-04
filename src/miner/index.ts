import { JSONPreset } from "lowdb/node";
import express from "express";
import fs from "node:fs";
import bodyParser from "body-parser";
import { config, portNumber } from "../inputUtility.js";
import * as transactions from "./transactions.js";
import * as send from "./send.js";
import * as publicKey from "./publicKey.js";
import { Transaction } from "./transactions.js";

type MinerConfig = { portNumber: number };

export type Data = {
    config: MinerConfig;
    transactions: Transaction[];
    publicKeys: [string, string][];
};

export type Route = (
    req: express.Request,
    res: express.Response,
) => Promise<void>;

const minerPath = (name: string) => `./miners/${name}.json`;

export const initialTransaction = (name: string) => ({
    from: "__network__",
    to: name,
    amount: 100,
    message: `${name} get 100CT through mining`,
    signature: "__sign__",
});

const getDB = (name: string) =>
    JSONPreset<Data>(minerPath(name), {
        config: { portNumber: 0 },
        transactions: [initialTransaction(name)],
        publicKeys: [],
    });

async function createNewDB(name: string) {
    const port = await portNumber(
        "Specify the full node port number",
        "Please enter a number (0 ~ 65535)",
    );

    const db = await getDB(name);
    db.data.config.portNumber = port;
    await db.write();

    console.log(`Wallet initialization completed on ${minerPath(name)}`);
}

async function initDB(name: string): Promise<boolean> {
    if (!fs.existsSync(minerPath(name))) {
        const newMiner = await config(
            "You are not registered. Would you like to register a new one?",
            true,
        );

        if (newMiner) {
            await createNewDB(name);
        } else {
            return false;
        }
    }
    return true;
}

export async function miner(name: string) {
    if (!(await initDB(name))) {
        console.log("See you again 👋");
        return;
    }

    const db = await getDB(name);
    const port = db.data.config.portNumber;

    const app = express();
    const jsonParser = bodyParser.json();

    // {} => Transaction[]
    app.get("/transactions", transactions.route(db));

    // Transaction => SendResult
    app.post("/send", jsonParser, send.route(db));

    // SendPublicKeyData => ResultSendPublicKey
    app.post("/publicKey", jsonParser, publicKey.route(db));

    app.listen(port, () => {
        console.log(`Start on port ${port}.`);
    });
}
