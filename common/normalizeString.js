"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = void 0;
const charMap = {
    đ: 'd',
    ŋ: 'n',
    š: 's',
    ŧ: 't',
    û: 'u',
    ù: 'u',
    ú: 'u',
    ü: 'u',
    ö: 'ø',
    á: 'a',
    à: 'a',
    â: 'a',
    ã: 'a',
    ä: 'a',
    '.': '-',
};
const charsToReplace = Object.keys(charMap).reduce((acc, char) => {
    return acc + char;
}, '');
const replaceSpecialCharPattern = new RegExp(`[${charsToReplace}]`, 'g');
const replaceSpecialCharFunc = (match) => {
    const newChar = charMap[match];
    return newChar !== undefined ? newChar : match;
};
const normalizeString = (str) => str
    ? str
        .toLowerCase()
        .replace(replaceSpecialCharPattern, replaceSpecialCharFunc)
    : '';
exports.normalizeString = normalizeString;
