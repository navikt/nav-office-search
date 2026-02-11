"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSearchClient = exports.abortSearchClient = void 0;
const urls_1 = require("../urls");
let abortController = typeof window !== 'undefined' ? new AbortController() : null;
const abortSearchClient = () => abortController?.abort();
exports.abortSearchClient = abortSearchClient;
const fetchSearchClient = (query) => {
    (0, exports.abortSearchClient)();
    abortController = new AbortController();
    return fetch(`${urls_1.clientUrls.searchApi}?query=${query}`, {
        signal: abortController.signal,
    })
        .then((res) => res.json())
        .catch((e) => {
        if (e.name === 'AbortError') {
            return { type: 'error', aborted: true };
        }
        return { type: 'error', messageId: 'errorServerError' };
    });
};
exports.fetchSearchClient = fetchSearchClient;
