export function base64encode(data: Uint8Array): string {
    return btoa(String.fromCharCode(...data));
}

export function base64decode(data: string): Uint8Array {
    return Uint8Array.from(atob(data), (s) => s.charCodeAt(0));
}
