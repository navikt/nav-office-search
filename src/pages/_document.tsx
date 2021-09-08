import React from 'react';
import Document, {
    DocumentContext,
    Head,
    Html,
    Main,
    NextScript,
} from 'next/document';
import { getDecoratorComponents } from '../utils/decorator';
import { Components } from '@navikt/nav-dekoratoren-moduler/ssr';
import { Locale } from '../localization/LocaleString';

type DocumentProps = {
    Decorator: Components;
};

class MyDocument extends Document<DocumentProps> {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);

        const Decorator = await getDecoratorComponents(ctx.locale as Locale);

        return {
            ...initialProps,
            Decorator,
        };
    }

    render() {
        const { Decorator, locale } = this.props;

        return (
            <Html lang={locale}>
                <Head>
                    <Decorator.Styles />
                </Head>
                <body>
                    <Decorator.Header />
                    <Main />
                    <Decorator.Footer />
                    <Decorator.Scripts />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
