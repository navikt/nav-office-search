export const encodeBase64 = (str: string) =>
    Buffer.from(str).toString('base64');
