import React from 'react';
import Document, {
    DocumentContext,
    Head,
    Html,
    Main,
    NextScript,
} from 'next/document';
import { getDecoratorComponents } from '../decorator';
import { Components } from '@navikt/nav-dekoratoren-moduler/ssr';

type DocumentProps = {
    Decorator: Components;
};

class MyDocument extends Document<DocumentProps> {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);

        const Decorator = await getDecoratorComponents();

        return {
            ...initialProps,
            Decorator,
        };
    }

    render() {
        const { Decorator } = this.props;

        return (
            <Html lang={'no'}>
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
