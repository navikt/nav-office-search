"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const react_1 = __importDefault(require("react"));
const server_1 = require("react-dom/server");
const App_1 = require("./App");
const render = (locale) => {
    return (0, server_1.renderToString)(react_1.default.createElement(App_1.App, { locale: locale }));
};
exports.render = render;
