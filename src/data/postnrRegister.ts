import Cache from 'node-cache';
import fs from 'fs';
import { normalizeString } from '../utils';
import { PostnrDataOld, PostnrKategori } from '../types/postnr';
import { urls } from '../urls';

type PostnrRegisterItem = [
    postnr: string,
    poststed: string,
    kommunenr: string,
    kommune: string,
    kategori: PostnrKategori
];

const localFallbackPath = './rawdata/postnummerregister-ansi.txt';
const charEncodeFormat = 'windows-1252';

const oneDayInSeconds = 3600 * 24;

const postnrRegisterCacheKey = 'postnrRegister';
const postnrRegisterCache = new Cache({
    stdTTL: oneDayInSeconds,
    deleteOnExpire: false,
});

postnrRegisterCache.on('expired', (key) => {
    if (key === postnrRegisterCacheKey) {
        loadPostnrRegister();
    }
});

const transformPostnrRegisterData = (rawText: string): PostnrDataOld[] => {
    const itemsRaw = rawText.split('\n');

    return itemsRaw.map((itemRaw) => {
        const item = itemRaw.trim().split('\t') as PostnrRegisterItem;
        const [postnr, poststed, kommunenr, kommune, kategori] = item;

        return {
            poststedNormalized: normalizeString(poststed),
            postnr,
            poststed,
            kommunenr,
            kommune,
            kategori,
        };
    });
};

const fetchPostnrRegister = async (): Promise<string | null> => {
    try {
        return await fetch(urls.postnrRegister)
            .then((res) => {
                if (res.ok) {
                    return res.arrayBuffer();
                }

                throw new Error(
                    `Error fetching postnr register: ${res.status} - ${res.statusText}`
                );
            })
            .then((buffer) => new TextDecoder(charEncodeFormat).decode(buffer));
    } catch (e) {
        console.error(`Error fetching postnr register: ${e}`);
        return null;
    }
};

export const loadPostnrRegister = async () => {
    const postnrRegisterData = await fetchPostnrRegister();

    if (postnrRegisterData) {
        console.log('Refreshed postnr register');
        postnrRegisterCache.set(
            postnrRegisterCacheKey,
            transformPostnrRegisterData(postnrRegisterData)
        );
    } else {
        if (postnrRegisterCache.has(postnrRegisterCacheKey)) {
            console.error(
                'Failed to fetch from postnr-register, re-using currently cached data'
            );
            postnrRegisterCache.ttl(postnrRegisterCacheKey, 600);
        } else {
            console.error(
                'Failed to fetch from postnr-register - no cached data exists, using local fallback'
            );

            const fallbackData = fs.readFileSync(localFallbackPath, {
                encoding: 'latin1',
            });

            postnrRegisterCache.set(
                postnrRegisterCacheKey,
                transformPostnrRegisterData(fallbackData),
                600
            );
        }
    }
};

export const getPostnrRegister = async (): Promise<PostnrDataOld[]> => {
    if (!postnrRegisterCache.has(postnrRegisterCacheKey)) {
        await loadPostnrRegister();
    }

    return postnrRegisterCache.get(postnrRegisterCacheKey) as PostnrDataOld[];
};
