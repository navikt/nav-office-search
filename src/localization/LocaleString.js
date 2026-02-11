"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleString = void 0;
const react_1 = __importDefault(require("react"));
const useLocale_1 = require("./useLocale");
const localeString_1 = require("../../common/localization/localeString");
const LocaleString = ({ id, args = [] }) => {
    const locale = (0, useLocale_1.useLocale)();
    return react_1.default.createElement(react_1.default.Fragment, null, (0, localeString_1.localeString)(id, locale, args));
};
exports.LocaleString = LocaleString;
