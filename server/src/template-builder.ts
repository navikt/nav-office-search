import path from 'path';
import fs from 'fs';
import { Params } from '@navikt/nav-dekoratoren-moduler';
import { injectDecoratorServerSide } from '@navikt/nav-dekoratoren-moduler/ssr';

const templatePath =
    process.env.NODE_ENV === 'development'
        ? path.resolve(process.cwd(), '..', 'index.html')
        : path.resolve(process.cwd(), '..', 'dist', 'client', 'index.html');

// const baseTemplate = fs.readFileSync(templatePath, 'utf-8');

export const getTemplateWithDecorator = (params: Params) => {
    return injectDecoratorServerSide({
        filePath: templatePath,
        env: 'prod',
        ...params,
    });
};
