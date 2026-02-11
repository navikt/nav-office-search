"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNameQuery = exports.isValidPostnrQuery = void 0;
const postnrQueryRegex = /^\d{4}$/;
const isValidPostnrQuery = (query) => {
    if (!query) {
        return false;
    }
    const postnr = query.split(' ')[0];
    return postnr && postnrQueryRegex.test(postnr);
};
exports.isValidPostnrQuery = isValidPostnrQuery;
const nameQueryRegex = /^(\p{Letter}|\.|-| ){2,}$/u;
const isValidNameQuery = (query) => {
    return query && nameQueryRegex.test(query);
};
exports.isValidNameQuery = isValidNameQuery;
