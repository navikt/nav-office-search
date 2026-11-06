import { LRUCache } from 'lru-cache';
import type { RequestHandler } from 'express';

type CacheMiddlewareOptions = {
	ttlSec: number;
	maxSize: number;
};

type ResponseCacheEntry = {
	sentData: any;
	statusCode: number;
};

export const createCacheMiddleware = ({ ttlSec, maxSize }: CacheMiddlewareOptions): RequestHandler => {
	const cache = new LRUCache<string | number, ResponseCacheEntry>({
		ttl: ttlSec * 1000,
		max: maxSize,
	});

	return (req, res, next) => {
		const { originalUrl } = req;

		const cachedRes = cache.get(originalUrl);
		if (cachedRes) {
			const { sentData, statusCode } = cachedRes;
			return res.status(statusCode).send(sentData);
		}

		const originalSend = res.send;

		res.send = (sentData) => {
			const { statusCode } = res;
			if (statusCode < 400) {
				cache.set(originalUrl, {
					sentData,
					statusCode,
				});
			}

			return originalSend.bind(res)(sentData);
		};

		next();
	};
};
