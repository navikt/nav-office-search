export const encodeBase64 = (str: string) =>
    Buffer.from(str).toString('base64');

const charMap: { [key: string]: string } = {
    æ: 'e',
    ø: 'o',
    đ: 'd',
    ŋ: 'n',
    ŧ: 't',
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
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
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
