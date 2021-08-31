import { Response } from 'express';
import { getPostnrRegister, PostnrData } from '../../data/postnrRegister';
import { Bydel, getBydelerData } from '../../data/bydeler';
import { normalizeString, removeDuplicates } from '../../utils';
import { SearchHitProps } from '../../types/searchResult';

type FetchOfficeInfoProps = {
    geografiskNr: string;
    hitString: string;
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

const generateResponseData = async (
    poststeder: PostnrData[],
    bydeler: Bydel[]
): Promise<SearchHitProps[]> => {
    const responseData: SearchHitProps[] = [];
    const fetchProps: FetchOfficeInfoProps[] = [];

    for (const poststed of poststeder) {
        if (poststed.bydeler) {
            for (const bydel of poststed.bydeler) {
                fetchProps.push({
                    geografiskNr: bydel.bydelsnr,
                    hitString: poststed.poststed,
                });
            }
        } else {
            fetchProps.push({
                geografiskNr: poststed.kommunenr,
                hitString: poststed.poststed,
            });
        }
    }

    for (const bydel of bydeler) {
        fetchProps.push({
            geografiskNr: bydel.bydelsnr,
            hitString: bydel.navn,
        });
    }

    const fetchPropsUnique = removeDuplicates(
        fetchProps,
        (a: FetchOfficeInfoProps, b: FetchOfficeInfoProps) =>
            a.geografiskNr === b.geografiskNr
    );

    for (const props of fetchPropsUnique) {
        // const officeInfo = await fetchOfficeInfoAndTransformResult(props);
        //
        // if (officeInfo) {
        //     responseData.push(officeInfo);
        // }
    }

    return removeDuplicates(responseData);
};

export const responseFromNameSearch = async (
    res: Response,
    searchTerm: string
) => {
    const normalizedTerm = normalizeString(searchTerm);

    const poststederHits = await findPoststeder(normalizedTerm);

    const bydelerHits = findBydeler(normalizedTerm);

    const responseData = await generateResponseData(
        poststederHits,
        bydelerHits
    );

    return res.status(200).send(responseData);
};
