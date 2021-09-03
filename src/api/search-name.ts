import { getPostnrRegister } from '../data/postnrRegister';
import { getBydelerData } from '../data/bydeler';
import { normalizeString, removeDuplicates } from '../utils';
import {
    NameHit,
    OfficeHitProps,
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

const sortNamesearch =
    (queryNormalized: string) => (a: NameHit, b: NameHit) => {
        const aNormalized = normalizeString(a.name);
        const bNormalized = normalizeString(b.name);

        const aStartsWithInput = aNormalized.startsWith(queryNormalized);
        const bStartsWithInput = bNormalized.startsWith(queryNormalized);

        if (aStartsWithInput && !bStartsWithInput) {
            return -1;
        }

        if (!aStartsWithInput && bStartsWithInput) {
            return 1;
        }

        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
    };

const transformHits = async (
    poststeder: PostnrData[],
    bydeler: Bydel[],
    normalizedQuery: string
): Promise<NameHit[]> => {
    const hitsMap: { [name: string]: OfficeHitProps[] } = {};
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
            const name = props.adressenavn;
            if (!hitsMap[name]) {
                hitsMap[name] = [];
            }

            if (
                !hitsMap[name].some((hit) => hit.enhetNr === officeInfo.enhetNr)
            ) {
                hitsMap[name].push(officeInfo);
            }
        }
    }

    return Object.entries(hitsMap)
        .map(([name, hits]) => ({
            name: name,
            officeHits: removeDuplicates(
                hits,
                (a, b) => a.enhetNr === b.enhetNr
            ).sort((a, b) => (a.kontorNavn > b.kontorNavn ? 1 : -1)),
        }))
        .sort(sortNamesearch(normalizedQuery));
};

export const responseFromNameSearch = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultNameProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const normalizedQuery = normalizeString(query);

    const poststederHits = await findPoststeder(normalizedQuery);

    const bydelerHits = findBydeler(normalizedQuery);

    const allHits = await transformHits(
        poststederHits,
        bydelerHits,
        normalizedQuery
    );

    return res
        .status(200)
        .send({ nameHits: allHits, type: 'name', input: query });
};
