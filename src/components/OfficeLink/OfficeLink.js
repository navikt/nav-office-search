"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeLink = void 0;
const react_1 = __importDefault(require("react"));
const ds_react_1 = require("@navikt/ds-react");
const OfficeLinkChevron_1 = require("./OfficeLinkChevron");
const OfficeLink_module_css_1 = __importDefault(require("./OfficeLink.module.css"));
const OfficeLink = ({ officeInfo }) => {
    const { url, name } = officeInfo;
    return (react_1.default.createElement(ds_react_1.Link, { href: url, className: OfficeLink_module_css_1.default.link },
        react_1.default.createElement(OfficeLinkChevron_1.OfficeLinkChevron, { className: OfficeLink_module_css_1.default.chevron, "aria-hidden": true }),
        react_1.default.createElement(ds_react_1.BodyShort, null, name)));
};
exports.OfficeLink = OfficeLink;
