import { NextApiRequest, NextApiResponse } from 'next';
import { getPostnrRegister } from '../data/postnrRegister';
import { AdresseSokResponse, fetchTpsAdresseSok } from '../fetch/server/postnr';
import {
    SearchHitProps,
    SearchResultErrorProps,
    SearchResultPostnrProps,
} from '../types/searchResult';
import { fetchOfficeInfoByGeoId } from '../fetch/server/office-info';
import { apiErrorResponse } from './utils';
import { PostnrData, PostnrKategori } from '../types/postnr';

const postboksResponse = async (
    postnrData: PostnrData
): Promise<SearchResultPostnrProps> => {
    const geoIds = postnrData.bydeler?.map((bydel) => bydel.bydelsnr) || [
        postnrData.kommunenr,
    ];

    const hits: SearchHitProps[] = [];

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
        hits,
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
    };
};

const homeResponse = (
    postnrData: PostnrData,
    apiResponse: AdresseSokResponse,
    showAdresse: boolean
): SearchResultPostnrProps => {
    return {
        type: 'postnr',
        hits: apiResponse.hits,
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
        showAdresse,
    };
};

type Query = {
    query: string;
};

export const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultPostnrProps | SearchResultErrorProps>
) => {
    const { query } = req.query as Query;

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
        return res.status(200).send(await postboksResponse(postnrData));
    }

    const adresse = adresseSegments?.join(' ').trim();

    const adresseSokRes = await fetchTpsAdresseSok(postnr, adresse);
    console.log(postnr, adresse);

    if (adresseSokRes.error) {
        return res
            .status(adresseSokRes.statusCode)
            .send(apiErrorResponse('errorServerError'));
    }

    return res
        .status(200)
        .send(homeResponse(postnrData, adresseSokRes, !!adresse));
};
