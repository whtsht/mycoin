import { Low } from "lowdb";
import { Data, Route } from "./index.js";

export function route(db: Low<Data>): Route {
    return async (_, res) => {
        await db.read();
        res.send(JSON.stringify(db.data.transactions));
    };
}
