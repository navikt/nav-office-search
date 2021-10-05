import Cache from 'node-cache';
import fs from 'fs';
import { PostnrKategori } from '../../types/data';
import { urls } from '../../urls';

const localFallbackPath = './rawdata/postnummerregister-ansi.txt';
const charEncodeFormat = 'windows-1252';

const postnrRegisterCacheKey = 'postnrRegister';
const postnrRegisterCache = new Cache({
    stdTTL: 3600,
    deleteOnExpire: false,
});

postnrRegisterCache.on('expired', () => {
    loadPostnrRegister();
});

type PostnrRegisterItem = [
    postnr: string,
    poststed: string,
    kommunenr: string,
    kommune: string,
    kategori: PostnrKategori
];

export type PostnrRegisterData = {
    postnr: string;
    poststed: string;
    kommune: string;
    kommunenr: string;
    kategori: PostnrKategori;
};

const transformPostnrRegisterData = (rawText: string): PostnrRegisterData[] => {
    const itemsRaw = rawText.split('\n');

    return itemsRaw.map((itemRaw) => {
        const item = itemRaw.trim().split('\t') as PostnrRegisterItem;
        const [postnr, poststed, kommunenr, kommune, kategori] = item;

        return {
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

const loadPostnrRegister = async () => {
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

export const getPostnrRegister = async (): Promise<PostnrRegisterData[]> => {
    if (!postnrRegisterCache.has(postnrRegisterCacheKey)) {
        await loadPostnrRegister();
    }

    return postnrRegisterCache.get(
        postnrRegisterCacheKey
    ) as PostnrRegisterData[];
};
