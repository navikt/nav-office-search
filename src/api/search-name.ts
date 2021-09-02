import { getPostnrRegister } from '../data/postnrRegister';
import { getBydelerData } from '../data/bydeler';
import { normalizeString, removeDuplicates } from '../utils';
import {
    SearchHitProps,
    SearchResultErrorProps,
    SearchResultNameProps,
} from '../types/searchResult';
import { PostnrData } from '../types/postnr';
import { Bydel } from '../types/bydel';
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchOfficeInfoByGeoId } from './fetch/office-info';

type FetchOfficeInfoProps = {
    geografiskNr: string;
    adressenavn: string;
};

const findBydeler = (term: string) => {
    return getBydelerData().filter((bydel) =>
        bydel.navnNormalized.includes(term)
    );
};

const findPoststeder = async (term: string): Promise<PostnrData[]> => {
    const results = (await getPostnrRegister()).reduce(
        (acc, item) =>
            item.poststedNormalized.includes(term) ? [...acc, item] : acc,
        [] as PostnrData[]
    );

    return removeDuplicates(
        results,
        (a: PostnrData, b: PostnrData) => a.kommunenr === b.kommunenr
    );
};

const generateSearchHits = async (
    poststeder: PostnrData[],
    bydeler: Bydel[]
): Promise<SearchHitProps[]> => {
    const hits: SearchHitProps[] = [];
    const fetchProps: FetchOfficeInfoProps[] = [];

    for (const poststed of poststeder) {
        if (poststed.bydeler) {
            for (const bydel of poststed.bydeler) {
                fetchProps.push({
                    geografiskNr: bydel.bydelsnr,
                    adressenavn: poststed.poststed,
                });
            }
        } else {
            fetchProps.push({
                geografiskNr: poststed.kommunenr,
                adressenavn: poststed.poststed,
            });
        }
    }

    for (const bydel of bydeler) {
        fetchProps.push({
            geografiskNr: bydel.bydelsnr,
            adressenavn: bydel.navn,
        });
    }

    const fetchPropsUnique = removeDuplicates(
        fetchProps,
        (a: FetchOfficeInfoProps, b: FetchOfficeInfoProps) =>
            a.geografiskNr === b.geografiskNr
    );

    for (const props of fetchPropsUnique) {
        const officeInfo = await fetchOfficeInfoByGeoId(props.geografiskNr);

        if (officeInfo && !officeInfo.error) {
            hits.push({ ...officeInfo, adressenavn: props.adressenavn });
        }
    }

    return removeDuplicates(hits);
};

export const responseFromNameSearch = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultNameProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const normalizedQuery = normalizeString(query);

    console.log(query, normalizedQuery);

    const poststederHits = await findPoststeder(normalizedQuery);

    console.log('poststeder:', poststederHits);

    const bydelerHits = findBydeler(normalizedQuery);

    console.log('bydeler:', bydelerHits);

    const searchHits = await generateSearchHits(poststederHits, bydelerHits);

    return res
        .status(200)
        .send({ hits: searchHits, type: 'name', input: query });
};
