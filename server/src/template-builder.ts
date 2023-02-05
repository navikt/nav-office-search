import path from 'path';
import { injectDecoratorServerSide } from '@navikt/nav-dekoratoren-moduler/ssr';
import { getDecoratorParams } from '../../src-common/decoratorParams';

const templatePath =
    process.env.NODE_ENV === 'development'
        ? path.resolve(process.cwd(), '..', 'index.html')
        : path.resolve(process.cwd(), '..', 'dist', 'client', 'index.html');

export const getTemplateWithDecorator = (locale: any) => {
    const params = getDecoratorParams('nb');

    try {
        return injectDecoratorServerSide({
            filePath: templatePath,
            env: 'prod',
            ...params,
        });
    } catch (e) {
        console.log(e);
        return 'asdf';
    }
};
