import { Express, RequestHandler } from 'express';

type Method =
    | 'all'
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'options'
    | 'head';

const pathPrefix = process.env.VITE_APP_BASEPATH;

export const configureRequestHandler = (
    expressApp: Express,
    path: string,
    handler: RequestHandler,
    method: Method = 'get'
) => {
    expressApp[method](`${pathPrefix}${path}`, handler);
};
