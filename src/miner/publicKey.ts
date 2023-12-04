import { Low } from "lowdb";
import { Data, Route } from "./index.js";

export type SendPublicKeyData = {
    name: string;
    publicKey: string;
};

export type ResultSendPublicKey = "OK" | { errorMessage: string };

export function route(db: Low<Data>): Route {
    return async (req, res) => {
        const data = req.body as SendPublicKeyData;

        if (!db.data.publicKeys.map(([name, _]) => name).includes(data.name)) {
            db.data.publicKeys.push([data.name, data.publicKey]);
            await db.write();
            res.send(JSON.stringify("OK"));
        } else {
            res.send(
                JSON.stringify({
                    errorMessage: "Public Key has already been registered",
                }),
            );
        }
    };
}
