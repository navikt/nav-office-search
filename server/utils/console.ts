import { logger } from '@navikt/navno-logger';

// Dependencies log through console: nav-dekoratoren-moduler does when the decorator doesn't answer. In a pod that
// is a line of plain text among the JSON lines, so console goes through the logger.
// main.ts imports this before anything else, which already logs while it loads
console.debug = (...args) => logger.debug(...args);
console.log = (...args) => logger.info(...args);
console.info = (...args) => logger.info(...args);
console.warn = (...args) => logger.warn(...args);
console.error = (...args) => logger.error(...args);
