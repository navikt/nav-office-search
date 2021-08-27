export const encodeBase64 = (str: string) =>
    Buffer.from(str).toString('base64');

const charMap: { [key: string]: string } = {
    æ: 'ae',
    ø: 'o',
    đ: 'd',
    ŋ: 'n',
    ŧ: 't',
    '.': '',
    ' ': '-',
};

const charsToReplace = Object.keys(charMap).reduce((acc, char) => {
    return acc + char;
}, '');

const replaceSpecialCharPattern = new RegExp(`[${charsToReplace}]`, 'g');

const replaceSpecialCharFunc = (match: string) => {
    const newChar = charMap[match];
    return newChar !== undefined ? newChar : match;
};

export const normalizeString = (str: string) =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(replaceSpecialCharPattern, replaceSpecialCharFunc);