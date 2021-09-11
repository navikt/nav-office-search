const postnrQueryRegex = new RegExp('^\\d{4}$');

export const isValidPostnrQuery = (query: string) => {
    const [postnr] = query?.split(' ');

    return postnr && postnrQueryRegex.test(postnr);
};

const nameQueryRegex = new RegExp('^(\\p{Letter}|\\.|-| ){2,}$', 'u');

export const isValidNameQuery = (query: string) => {
    return query && nameQueryRegex.test(query);
};
