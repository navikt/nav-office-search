import { PostnrKategori } from '../../../common/types/data';
import { serverUrls } from '../urls';

const charEncodeFormat = 'windows-1252';

type PostnrRegisterItemRaw = [
    postnr: string,
    poststed: string,
    kommunenr: string,
    kommune: string,
    kategori: PostnrKategori
];

export type PostnrRegisterItem = {
    postnr: string;
    poststed: string;
    kommune: string;
    kommunenr: string;
    kategori: PostnrKategori;
};

let postnrRegisterData: PostnrRegisterItem[] = [];

const transformPostnrRegisterData = (rawText: string): PostnrRegisterItem[] => {
    const itemsRaw = rawText.split('\n');

    return itemsRaw.map((itemRaw) => {
        const item = itemRaw.trim().split('\t') as PostnrRegisterItemRaw;
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
        return await fetch(serverUrls.postnrRegister)
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
    const postnrRegisterDataRaw = await fetchPostnrRegister();

    if (postnrRegisterDataRaw) {
        console.log('Refreshed postnr register');
        postnrRegisterData = transformPostnrRegisterData(postnrRegisterDataRaw);
    } else if (postnrRegisterData.length > 0) {
        console.error(
            'Failed to fetch from postnr-register, keeping currently cached data'
        );
    } else {
        const msg =
            'Failed to fetch from postnr-register and no previously cached data exists!';
        console.error(msg);

        throw new Error(msg);
    }
};

export const getPostnrRegister = () => {
    return postnrRegisterData;
};
