import { ErrorRequestHandler, Express, RequestHandler } from 'express';

const createNotFoundHandler = async (): Promise<RequestHandler> => {
    // Fetch static 404-page from the nav.no frontend
    const notFoundHtml = await fetch(`${process.env.VITE_NAVNO_ORIGIN}/404`)
        .then((res) => {
            if (res.status === 404) {
                return res.text();
            }

            throw Error(`${res.status} ${res.statusText}`);
        })
        .catch((e) => {
            console.error(`Failed to fetch 404 html - ${e}`);
            return 'Not found';
        });

    return (req, res, _) => {
        res.status(404).send(notFoundHtml);
    };
};

export const registerErrorHandlers = async (expressApp: Express) => {
    const notFoundHandler = await createNotFoundHandler();

    expressApp.use(notFoundHandler);

    expressApp.use(((err, req, res, next) => {
        const { path } = req;
        const { status, stack } = err;
        const msg = stack?.split('\n')[0];
        const statusCode = status || 500;

        if (statusCode < 500) {
            console.log(`Invalid request to ${path}: ${statusCode} ${msg}`);
            return notFoundHandler(req, res, next);
        }

        console.error(`Server error on ${path}: ${statusCode} ${msg}`);

        // TODO: Html for server errors
        return res.status(statusCode).end();
    }) as ErrorRequestHandler);
};
