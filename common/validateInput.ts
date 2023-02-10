const postnrQueryRegex = /^\d{4}$/;

export const isValidPostnrQuery = (query: string) => {
    if (!query) {
        return false;
    }

    const postnr = query.split(' ')[0];

    return postnr && postnrQueryRegex.test(postnr);
};

const nameQueryRegex = /^(\p{Letter}|\.|-| ){2,}$/u;

export const isValidNameQuery = (query: string) => {
    return query && nameQueryRegex.test(query);
};
