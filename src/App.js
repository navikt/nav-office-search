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
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importStar(require("react"));
// Import global style early to ensure the later component-level imports
// gets higher specificity
require("./global.css");
const OfficeSearch_1 = require("./components/OfficeSearch");
const useLocale_1 = require("./localization/useLocale");
const nav_dekoratoren_moduler_1 = require("@navikt/nav-dekoratoren-moduler");
const decoratorParams_1 = require("../common/decoratorParams");
const urls_1 = require("./urls");
const localeString_1 = require("../common/localization/localeString");
const App = ({ locale = 'nb' }) => {
    const [currentLocale, setCurrentLocale] = (0, react_1.useState)(locale);
    (0, react_1.useEffect)(() => {
        const updateLanguageState = (newLocale) => {
            setCurrentLocale(newLocale);
            window.history.replaceState(window.history.state, '', urls_1.clientUrls.appPath[newLocale]);
            document.documentElement.lang = newLocale;
            document.title = (0, localeString_1.localeString)('documentTitle', newLocale);
            (0, nav_dekoratoren_moduler_1.setParams)((0, decoratorParams_1.getDecoratorParams)(newLocale, urls_1.clientUrls.kontaktOss));
        };
        (0, nav_dekoratoren_moduler_1.onLanguageSelect)((language) => {
            updateLanguageState(language.locale);
        });
    }, []);
    return (react_1.default.createElement(useLocale_1.LocaleProvider, { value: currentLocale },
        react_1.default.createElement(OfficeSearch_1.OfficeSearch, null)));
};
exports.App = App;
