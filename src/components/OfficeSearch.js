"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeSearch = void 0;
const react_1 = __importDefault(require("react"));
const SearchForm_1 = require("./SearchForm/SearchForm");
const ds_react_1 = require("@navikt/ds-react");
const LocaleString_1 = require("../localization/LocaleString");
const OfficeSearch_module_css_1 = __importDefault(require("./OfficeSearch.module.css"));
const OfficeSearch = () => {
    return (react_1.default.createElement("div", { className: OfficeSearch_module_css_1.default.appContainer },
        react_1.default.createElement(ds_react_1.Heading, { size: 'xlarge', className: OfficeSearch_module_css_1.default.title },
            react_1.default.createElement(LocaleString_1.LocaleString, { id: 'pageTitle' })),
        react_1.default.createElement(ds_react_1.BodyLong, { className: OfficeSearch_module_css_1.default.ingress },
            react_1.default.createElement(LocaleString_1.LocaleString, { id: 'ingressLine1' }),
            react_1.default.createElement("br", null),
            react_1.default.createElement(LocaleString_1.LocaleString, { id: 'ingressLine2' })),
        react_1.default.createElement(SearchForm_1.SearchForm, null)));
};
exports.OfficeSearch = OfficeSearch;
