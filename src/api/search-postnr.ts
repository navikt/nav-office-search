import { NextApiRequest, NextApiResponse } from 'next';
import { getPostnrRegister } from '../data/postnrRegister';
import { fetchTpsAdresseSok } from './fetch/postnr';
import {
    OfficeHitProps,
    SearchResultErrorProps,
    SearchResultPostnrProps,
} from '../types/searchResult';
import { fetchOfficeInfoByGeoId } from './fetch/office-info';
import { apiErrorResponse } from './utils';
import { PostnrData, PostnrKategori } from '../types/postnr';

const sortByOfficeName = (a: OfficeHitProps, b: OfficeHitProps) =>
    a.kontorNavn > b.kontorNavn ? 1 : -1;

// Response-data for postnr used for po-boxes or other special purposes
const specialResponse = async (
    postnrData: PostnrData
): Promise<SearchResultPostnrProps> => {
    const geoIds = postnrData.bydeler?.map((bydel) => bydel.bydelsnr) || [
        postnrData.kommunenr,
    ];

    const hits: OfficeHitProps[] = [];

    for (const id of geoIds) {
        const officeInfo = await fetchOfficeInfoByGeoId(id);
        if (
            officeInfo &&
            !officeInfo.error &&
            !hits.some((hit) => hit.enhetNr === officeInfo.enhetNr)
        ) {
            hits.push(officeInfo);
        }
    }

    return {
        type: 'postnr',
        hits: hits.sort(sortByOfficeName),
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
        kommune: postnrData.kommune,
    };
};

// Response-data for postnr used for home adresses
const homeResponse = (
    postnrData: PostnrData,
    hits: OfficeHitProps[],
    adresse: string
): SearchResultPostnrProps => {
    return {
        type: 'postnr',
        hits,
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
        kommune: postnrData.kommune,
        adresseQuery: adresse,
    };
};

export const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultPostnrProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const [postnr, ...adresseSegments] = query?.split(' ');

    const postnrData = (await getPostnrRegister()).find(
        (item) => item.postnr === postnr
    );

    if (!postnrData) {
        return res.status(404).send(apiErrorResponse('errorInvalidPostnr'));
    }

    if (
        postnrData.kategori === PostnrKategori.Postbokser ||
        postnrData.kategori === PostnrKategori.Servicepostnummer
    ) {
        return res.status(200).send(await specialResponse(postnrData));
    }

    const adresse = adresseSegments?.join(' ').trim();

    const adresseSokRes = await fetchTpsAdresseSok(postnr, adresse);

    if (adresseSokRes.error) {
        console.error(
            `Error fetching postnr from query ${query} - ${adresseSokRes.statusCode} ${adresseSokRes.message}`
        );
        if (adresseSokRes.statusCode >= 500) {
            return res
                .status(adresseSokRes.statusCode)
                .send(apiErrorResponse('errorServerError'));
        }
    }

    return res
        .status(200)
        .send(
            homeResponse(
                postnrData,
                adresseSokRes.error ? [] : adresseSokRes.hits,
                adresse
            )
        );
};
