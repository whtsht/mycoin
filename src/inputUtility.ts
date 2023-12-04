import { createPromptModule } from "inquirer";

const prompt = createPromptModule();

export async function input(message: string): Promise<string> {
    const answer = await prompt({
        type: "input",
        name: "data",
        message,
    });

    return answer.data;
}

export async function integer(
    message: string,
    errorMessage: string,
): Promise<number> {
    const answer = await prompt({
        type: "input",
        name: "data",
        message,
        validate(value) {
            let valid = !isNaN(parseInt(value));
            return valid || errorMessage;
        },
        filter: Number,
    });

    return answer.data;
}

export async function portNumber(
    message: string,
    errorMessage: string,
): Promise<number> {
    const answer = await prompt({
        type: "input",
        name: "data",
        message,
        validate(value) {
            let valid = !isNaN(parseInt(value));
            const port = parseInt(value);
            valid = valid && 0 <= port && port <= 65535;
            return valid || errorMessage;
        },
        filter: Number,
    });

    return answer.data;
}

export async function config(
    message: string,
    default_: boolean,
): Promise<boolean> {
    const answer = await prompt({
        type: "confirm",
        name: "data",
        message,
        default: default_,
    });

    return answer.data;
}

export async function list(
    message: string,
    choices: string[],
): Promise<string> {
    const answer = await prompt({
        type: "list",
        name: "data",
        message,
        choices,
    });

    return answer.data;
}
