import { Low } from "lowdb";
import { Data, Route, Transaction } from "./index.js";

export function route(db: Low<Data>): Route {
    return async (req, res) => {
        const requestTransaction = req.body as Transaction;

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
