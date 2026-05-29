const postnrQueryRegex = /^\d{4}$/;

export const isValidPostnrQuery = (query: string) => {
    if (!query) {
        return false;
    }

    const postnr = query.split(' ')[0];

    return postnr && postnrQueryRegex.test(postnr);
};

const nameQueryRegex = /^[\p{Letter}\d., -]+$/u;

export const isValidNameQuery = (query: string) => {
    return Boolean(query.trim()) && nameQueryRegex.test(query);
};
