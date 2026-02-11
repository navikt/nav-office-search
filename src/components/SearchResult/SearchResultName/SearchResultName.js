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
exports.SearchResultName = void 0;
const react_1 = __importStar(require("react"));
const normalizeString_1 = require("../../../../common/normalizeString");
const LocaleString_1 = require("../../../localization/LocaleString");
const ds_react_1 = require("@navikt/ds-react");
const OfficeLink_1 = require("../../OfficeLink/OfficeLink");
const SearchResultName_module_css_1 = __importDefault(require("./SearchResultName.module.css"));
const NameWithHighlightedInput = ({ name, normalizedInput, }) => {
    const normalizedName = (0, normalizeString_1.normalizeString)(name);
    const startIndex = normalizedName.indexOf(normalizedInput);
    if (startIndex === -1) {
        return react_1.default.createElement(react_1.default.Fragment, null, name);
    }
    const preMatch = name.slice(0, startIndex);
    const inputMatch = name.slice(startIndex, startIndex + normalizedInput.length);
    const postMatch = name.slice(startIndex + normalizedInput.length);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        preMatch,
        react_1.default.createElement("strong", null, inputMatch),
        postMatch));
};
const SearchResultName = ({ result }) => {
    const { input, hits } = result;
    if (!hits) {
        return (react_1.default.createElement("div", null,
            react_1.default.createElement(LocaleString_1.LocaleString, { id: 'errorInvalidResult' })));
    }
    const normalizedInput = (0, normalizeString_1.normalizeString)(input);
    const numHits = hits.length;
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("div", { className: SearchResultName_module_css_1.default.header }, numHits === 0 ? (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'nameResultNone', args: [input] })) : (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'nameResultFound', args: [input, numHits.toString()] }))),
        hits.map((nameHit) => (react_1.default.createElement(react_1.Fragment, { key: nameHit.name },
            react_1.default.createElement(ds_react_1.BodyShort, { size: 'medium', className: SearchResultName_module_css_1.default.hitname },
                react_1.default.createElement(NameWithHighlightedInput, { name: nameHit.name.toUpperCase(), normalizedInput: normalizedInput })),
            nameHit.officeHits.map((office) => (react_1.default.createElement(OfficeLink_1.OfficeLink, { officeInfo: office, key: office.enhetNr }))))))));
};
exports.SearchResultName = SearchResultName;
