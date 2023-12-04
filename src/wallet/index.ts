import fs from "node:fs";
import { JSONPreset } from "lowdb/node";
import * as ed from "@noble/ed25519";
import { config, input, portNumber, list, integer } from "../inputUtility.js";
import { ResultSendPublicKey, SendPublicKeyData } from "../miner/publicKey.js";
import { base64decode, base64encode } from "../codec.js";
import { Transaction } from "../miner/transactions.js";
import { SendResult } from "../miner/send.js";

type Wallet = {
    name: string;
    nodePortNumber: number;
    privateKey: string;
};

const walletPath = (name: string) => `./wallets/${name}.json`;

const getDB = (name: string) =>
    JSONPreset<Wallet>(walletPath(name), {
        name,
        nodePortNumber: null,
        privateKey: base64encode(ed.utils.randomPrivateKey()),
    });

async function init(name: string): Promise<boolean> {
    const port = await portNumber(
        "Specify the full node port number",
        "Please enter a number",
    );

    const db = await getDB(name);
    db.data.nodePortNumber = port;
    await db.write();

    const data: SendPublicKeyData = {
        name,
        publicKey: base64encode(
            await ed.getPublicKeyAsync(base64decode(db.data.privateKey)),
        ),
    };

    console.log("Sending the public key to the node ...");
    const response = await fetch(`http://localhost:${port}/publicKey`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    const result = (await response.json()) as ResultSendPublicKey;

    if (result !== "OK") {
        console.log(result.errorMessage);
        return false;
    } else {
        console.log(`Wallet initialization completed on ${walletPath(name)}`);
        return true;
    }
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

async function send(name: string, port: number, privateKey: Uint8Array) {
    const from = name;

    const to = await input("Who do you send CT to?");

    const amount = await integer(
        "How many CTs will you send?",
        "Please enter a integer",
    );

    const message = `${from} sends ${amount}CT to ${to}`;
    const encoder = new TextEncoder();

    const signature = base64encode(
        await ed.signAsync(encoder.encode(message), privateKey),
    );

    const transaction: Transaction = { from, to, amount, message, signature };

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

        const success = newWallet && (await init(name));

        if (!success) {
            console.log("See you again 👋");
            return;
        }
    }

    const db = await getDB(name);
    const { nodePortNumber, privateKey: key } = db.data;

    const privateKey = base64decode(key);

    for (; ;) {
        const operation = (await list("What are you doing?", [
            "Show Transactions",
            "Send CT",
            "Quit",
        ])) as Operation;

        switch (operation) {
            case "Show Transactions":
                await transactions(nodePortNumber);
                break;
            case "Send CT":
                await send(name, nodePortNumber, privateKey);
                break;
            case "Quit":
                console.log("See you again 👋");
                return;
        }
    }
}
