const postnrQueryRegex = /^\d{4}$/;

export const isValidPostnrQuery = (query: string) => {
    if (!query) {
        return false;
    }

    return postnrQueryRegex.test(query.trim());
};

const nameQueryRegex = /^[\p{Letter}\d., -]+$/u;

export const isValidNameQuery = (query: string) => {
    return Boolean(query.trim()) && nameQueryRegex.test(query);
};
