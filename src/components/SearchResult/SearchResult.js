"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchResult = void 0;
const react_1 = __importDefault(require("react"));
const SearchResultPostnr_1 = require("./SearchResultPostnr/SearchResultPostnr");
const SearchResultName_1 = require("./SearchResultName/SearchResultName");
const SearchResult = ({ searchResult }) => {
    if (searchResult.type === 'postnr') {
        return react_1.default.createElement(SearchResultPostnr_1.SearchResultPostnr, { result: searchResult });
    }
    if (searchResult.type === 'name') {
        return react_1.default.createElement(SearchResultName_1.SearchResultName, { result: searchResult });
    }
    return null;
};
exports.SearchResult = SearchResult;
