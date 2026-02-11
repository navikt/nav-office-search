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
exports.SearchResultPostnr = void 0;
const react_1 = __importStar(require("react"));
const OfficeLink_1 = require("../../OfficeLink/OfficeLink");
const ds_react_1 = require("@navikt/ds-react");
const data_1 = require("../../../../common/types/data");
const LocaleString_1 = require("../../../localization/LocaleString");
const SearchResultPostnr_module_css_1 = __importDefault(require("./SearchResultPostnr.module.css"));
const HeaderText = (result) => {
    const { postnr, poststed, kommuneNavn, kategori, officeInfo, adresseQuery = '', withAllBydeler, } = result;
    const postnrOgPoststed = `${postnr} ${poststed}`;
    const numHits = officeInfo.length;
    if (numHits === 0) {
        return (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultNone', args: [postnrOgPoststed, adresseQuery] }));
    }
    if (numHits > 1) {
        if (kategori === data_1.PostnrKategori.Postbokser) {
            return (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultPostbox', args: [postnr, kommuneNavn, numHits.toString()] }));
        }
        if (kategori === data_1.PostnrKategori.Servicepostnummer) {
            return (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultServiceBox', args: [postnr, kommuneNavn, numHits.toString()] }));
        }
        if (withAllBydeler) {
            return (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultBydeler', args: [postnr, kommuneNavn, numHits.toString()] }));
        }
        return (react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultMany', args: [numHits.toString(), postnrOgPoststed, postnr] }));
    }
    return react_1.default.createElement(LocaleString_1.LocaleString, { id: 'postnrResultOne', args: [postnrOgPoststed] });
};
const SearchResultPostnr = ({ result }) => {
    const { officeInfo, adresseQuery } = result;
    if (!officeInfo) {
        return (react_1.default.createElement("div", null,
            react_1.default.createElement(LocaleString_1.LocaleString, { id: 'errorInvalidResult' })));
    }
    return (react_1.default.createElement("div", null,
        react_1.default.createElement(ds_react_1.BodyLong, { className: SearchResultPostnr_module_css_1.default.header },
            react_1.default.createElement(HeaderText, { ...result })),
        officeInfo.map((hit) => (react_1.default.createElement(react_1.Fragment, { key: hit.enhetNr },
            adresseQuery && (react_1.default.createElement(ds_react_1.BodyShort, { size: 'small' }, `${hit.hitString}:`)),
            react_1.default.createElement(OfficeLink_1.OfficeLink, { officeInfo: hit }))))));
};
exports.SearchResultPostnr = SearchResultPostnr;
