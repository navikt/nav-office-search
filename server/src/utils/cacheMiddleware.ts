import LRUCache from 'lru-cache';
import { RequestHandler } from 'express';

type CacheMiddlewareOptions = {
    cacheOnErrors?: boolean;
    ttlSec: number;
    maxSize: number;
};

type ResponseCacheEntry = {
    sent: any;
    statusCode: number;
};

export const createCacheMiddleware = ({
    cacheOnErrors = false,
    ttlSec,
    maxSize,
}: CacheMiddlewareOptions): RequestHandler => {
    const cache = new LRUCache<string | number, ResponseCacheEntry>({
        ttl: ttlSec * 1000,
        max: maxSize,
    });

    return (req, res, next) => {
        const { originalUrl } = req;

        const cachedRes = cache.get(originalUrl);
        if (cachedRes) {
            console.log('Sending cached response!');
            const { sent, statusCode } = cachedRes;
            return res.status(statusCode).send(sent);
        }

        const originalSend = res.send;

        res.send = (sentData) => {
            const { statusCode } = res;
            if (statusCode < 400 || cacheOnErrors) {
                console.log('Committing response to cache');
                cache.set(originalUrl, {
                    sent: sentData,
                    statusCode,
                });
            }

            return originalSend.bind(res)(sentData);
        };

        next();
    };
};
