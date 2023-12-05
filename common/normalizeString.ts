const charMap: { [key: string]: string } = {
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

const removeNavAtStartRegex = new RegExp(`^(nav)(.{3,})$`, 'i');

export const normalizeString = (str: string) => {
    if (!str) {
        return '';
    }

    const navMatch = str.match(removeNavAtStartRegex) || '';

    const normalized = str
        .toLowerCase()
        .replace(replaceSpecialCharPattern, replaceSpecialCharFunc)
        .replace(navMatch[0], navMatch[2]);

    return normalized;
};
