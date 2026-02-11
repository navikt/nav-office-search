"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localeString = void 0;
const nb_default_1 = require("./modules/nb-default");
const nn_1 = require("./modules/nn");
const en_1 = require("./modules/en");
const localeModules = {
    nb: nb_default_1.localeModuleNb,
    nn: nn_1.localeModuleNn,
    en: en_1.localeModuleEn,
};
const localeString = (id, locale, args = []) => {
    const value = localeModules[locale][id];
    return typeof value === 'function'
        ? value(...args)
        : value;
};
exports.localeString = localeString;
