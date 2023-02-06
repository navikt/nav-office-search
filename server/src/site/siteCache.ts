import LRUCache from 'lru-cache';
import { RequestHandler } from 'express';

type CacheMiddlewareOptions = {
    cacheOnErrors?: boolean;
    ttlSec: number;
    maxSize: number;
};

export const createCacheMiddleware = ({
    cacheOnErrors = false,
    ttlSec,
    maxSize,
}: CacheMiddlewareOptions): RequestHandler => {
    const cache = new LRUCache({ ttl: ttlSec * 1000, max: maxSize });

    return (req, res, next) => {
        const { originalUrl } = req;
        console.log(originalUrl);
        const cachedRes = cache.get(originalUrl);
        if (cachedRes) {
            console.log('Found cached response!');
            return res.send(cachedRes);
        }

        const originalSend = res.send;
        res.send = (sentData) => {
            if (res.statusCode < 400 || cacheOnErrors) {
                console.log('Committing response to cache');
                cache.set(originalUrl, sentData);
            }

            return originalSend.bind(res)(sentData);
        };

        next();
    };
};
