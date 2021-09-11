export const isValidPostnrQuery = (query: string) => {
    const [postnr] = query?.split(' ');

    return postnr && /^\d{4}$/.test(postnr);
};

export const isValidNameQuery = (query: string) => {
    return query && /^(\p{Letter}|\.|-| ){2,}$/gu.test(query);
};
