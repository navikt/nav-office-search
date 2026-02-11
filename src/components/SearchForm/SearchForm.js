"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchForm = void 0;
const react_1 = __importStar(require("react"));
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const ds_react_1 = require("@navikt/ds-react");
const LocaleString_1 = require("../../localization/LocaleString");
const SearchResult_1 = require("../SearchResult/SearchResult");
const fetch_1 = require("../../utils/fetch");
const validateInput_1 = require("../../../common/validateInput");
const SearchForm_module_css_1 = __importDefault(require("./SearchForm.module.css"));
const isEmptyInput = (input) => typeof input === 'string' && input.length === 0;
const isValidInput = (input) => typeof input === 'string' && input.length >= 2;
const SearchForm = () => {
    const [searchResult, setSearchResult] = (0, react_1.useState)();
    const [error, setError] = (0, react_1.useState)();
    const inputRef = (0, react_1.useRef)(null);
    const setClientError = (id) => {
        setError({ id: id, type: 'clientError' });
    };
    const setServerError = (id) => {
        setError({ id: id, type: 'serverError' });
    };
    const resetError = () => {
        setError(null);
    };
    const handleInput = (submit) => {
        const input = inputRef.current?.value;
        (0, fetch_1.abortSearchClient)();
        if (runSearch.cancel) {
            runSearch.cancel();
        }
        if (isEmptyInput(input)) {
            setSearchResult(undefined);
        }
        if (!isValidInput(input)) {
            if (submit) {
                setClientError('errorInputValidationLength');
            }
            else {
                resetError();
            }
            return;
        }
        if ((0, validateInput_1.isValidPostnrQuery)(input)) {
            runSearch(input);
            return;
        }
        else if (!isNaN(Number(input))) {
            if (submit) {
                setClientError('errorInputValidationPostnr');
            }
            else {
                resetError();
            }
            return;
        }
        if (!(0, validateInput_1.isValidNameQuery)(input)) {
            setClientError('errorInputValidationName');
            return;
        }
        runSearch(input);
    };
    const runSearch = (0, lodash_debounce_1.default)((input) => {
        resetError();
        (0, fetch_1.fetchSearchClient)(input).then((result) => {
            if (result.type === 'error') {
                if (result.aborted) {
                    return;
                }
                setSearchResult(undefined);
                setServerError(result.messageId || 'errorServerError');
            }
            else {
                setSearchResult(result);
            }
        });
    }, 500);
    const handleSubmit = (e) => {
        e.preventDefault();
        handleInput(true);
    };
    return (react_1.default.createElement("div", { className: SearchForm_module_css_1.default.searchForm },
        react_1.default.createElement("form", { onSubmit: handleSubmit, className: SearchForm_module_css_1.default.searchField },
            react_1.default.createElement(ds_react_1.Search, { variant: "primary", hideLabel: false, label: react_1.default.createElement(LocaleString_1.LocaleString, { id: 'inputLabel' }), id: "search-input", autoComplete: "off", ref: inputRef, onChange: () => handleInput(false), error: error?.type === 'clientError' && (react_1.default.createElement(LocaleString_1.LocaleString, { id: error.id })) })),
        error?.type === 'serverError' && (react_1.default.createElement("div", { className: SearchForm_module_css_1.default.error },
            react_1.default.createElement(LocaleString_1.LocaleString, { id: error.id }))),
        searchResult && (react_1.default.createElement("div", { className: SearchForm_module_css_1.default.searchResult },
            react_1.default.createElement(SearchResult_1.SearchResult, { searchResult: searchResult })))));
};
exports.SearchForm = SearchForm;
