import { Low } from "lowdb";
import { Data, Route } from "./index.js";

export type Transaction = {
    from: string;
    to: string;
    amount: number;
    message: string;
    signature: string;
};

export function route(db: Low<Data>): Route {
    return async (_, res) => {
        await db.read();
        res.send(JSON.stringify(db.data.transactions));
    };
}
