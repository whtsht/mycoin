import { JSONPreset } from "lowdb/node";
import { Data, SendResult, initialTransaction } from "../../src/miner/index.js";
import * as transactions from "../../src/miner/transactions.js";
import * as send from "../../src/miner/send.js";
import { Request, Response } from "express";
import { jest } from "@jest/globals";

const mockDB = () =>
    JSONPreset<Data>("/tmp/mock.db.json", {
        config: { portNumber: 0 },
        transactions: [initialTransaction("Risa")],
        publicKeys: [],
    });

describe("transactions", () => {
    it("initial", async () => {
        const req = {} as Request;
        const res = {
            send: jest.fn(),
        };
        const db = await mockDB();
        await transactions.route(db)(req, res as any as Response);

        expect(res.send).toHaveBeenCalledWith(
            JSON.stringify(db.data.transactions),
        );
    });

    it("send", async () => {
        const transactionList = [
            {
                from: "Risa",
                to: "Tom",
                amount: 10,
            },
            {
                from: "Risa",
                to: "Tom",
                amount: 20,
            },
            {
                from: "Risa",
                to: "Tom",
                amount: 80,
            },
        ];

        const resultList: SendResult[] = [
            "OK",
            "OK",
            { errorMessage: "There are not enough UTXO to send that amount" },
        ];

        const db = await mockDB();

        for (let i = 0; i < 3; i++) {
            const req = {
                body: transactionList[i],
            } as Request;
            const res = {
                send: jest.fn(),
            };
            await send.route(db)(req, res as any as Response);

            expect(res.send).toHaveBeenCalledWith(
                JSON.stringify(resultList[i]),
            );
        }

        const req = {} as Request;
        const res = {
            send: jest.fn(),
        };
        await transactions.route(db)(req, res as any as Response);
        expect(res.send).toHaveBeenCalledWith(
            JSON.stringify([
                { from: "__network__", to: "Risa", amount: 100 },
                { from: "Risa", to: "Tom", amount: 10 },
                { from: "Risa", to: "Tom", amount: 20 },
            ]),
        );
    });
});
