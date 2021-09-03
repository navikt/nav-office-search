export const encodeBase64 = (str: string) =>
    Buffer.from(str).toString('base64');

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

export const normalizeString = (str: string) =>
    str
        .toLowerCase()
        .replace(replaceSpecialCharPattern, replaceSpecialCharFunc);

export const removeDuplicates = <Type>(
    array: Type[],
    isEqualPredicate?: (a: any, b: any) => boolean
): Type[] =>
    isEqualPredicate
        ? array.filter((aItem, aIndex) => {
              const bIndex = array.findIndex((bItem) =>
                  isEqualPredicate(aItem, bItem)
              );
              return aIndex === bIndex;
          })
        : [...new Set(array)];

export const isPostnrQuery = (query: string) => {
    const [postnr] = query?.split(' ');

    return postnr && /^\d{4}$/.test(postnr);
};
