import { Low } from "lowdb";
import { Data, Route } from "./index.js";
import * as ed from "@noble/ed25519";
import { base64decode } from "../codec.js";
import { Transaction } from "./transactions.js";

export type SendResult = "OK" | { errorMessage: string };

export function route(db: Low<Data>): Route {
    return async (req, res) => {
        const requestTransaction = req.body as Transaction;

        const data = db.data.publicKeys
            .filter(([name, _]) => name == requestTransaction.from)
            .at(0);

        if (!data) {
            res.send(
                JSON.stringify({
                    errorMessage:
                        "Public Key is not Public key is not registered",
                }),
            );
            return;
        }

        const [_, key] = data;
        const publicKey = base64decode(key);
        const encoder = new TextEncoder();

        if (
            !(await ed.verifyAsync(
                base64decode(requestTransaction.signature),
                encoder.encode(requestTransaction.message),
                publicKey,
            ))
        ) {
            res.send(
                JSON.stringify({
                    errorMessage: "Signature is invalid",
                }),
            );
            return;
        }

        const input = db.data.transactions
            .filter((ts) => ts.to == requestTransaction.from)
            .reduce((acc, ts) => acc + ts.amount, 0);

        const output = db.data.transactions
            .filter((ts) => ts.from == requestTransaction.from)
            .reduce((acc, ts) => acc + ts.amount, 0);

        const utxo = input - output;

        if (utxo >= requestTransaction.amount) {
            db.data.transactions.push(requestTransaction);
            await db.write();
            res.send(JSON.stringify("OK"));
        } else {
            res.send(
                JSON.stringify({
                    errorMessage:
                        "There are not enough UTXO to send that amount",
                }),
            );
        }
    };
}
