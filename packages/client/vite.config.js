var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    process.env = __assign(__assign({}, process.env), loadEnv(mode, process.cwd()));
    return {
        plugins: [preact()],
        esbuild: {
            legalComments: 'none',
        },
        ssr: {
            // React modules from node_modules must not be externalized
            // in order to work with preact/compat
            noExternal: ['@navikt/ds-react', '@navikt/aksel-icons'],
        },
        base: process.env.VITE_APP_BASEPATH,
    };
});
