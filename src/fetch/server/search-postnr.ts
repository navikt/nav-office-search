import { NextApiResponse } from 'next';
import { errorResponse, ErrorResponse, fetchJson } from './fetch-utils';
import { getAuthorizationHeader } from './auth';
import {
    getPostnrRegister,
    PostnrData,
    PostnrKategori,
} from '../../data/postnrRegister';
import { PostnrSearchResult, SearchHitProps } from '../../types/searchResult';
import { fetchOfficeInfoByGeoId } from './office-info';

const apiUrl = `${process.env.API_ORIGIN}/postnr`;

export type PostnrApiResponse = {
    error?: undefined;
    hits: SearchHitProps[];
};

const fetchTpsPostnrSok = async (
    postnr: string
): Promise<PostnrApiResponse | ErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(`${apiUrl}/${postnr}`, undefined, {
        headers: { Authorization: authorizationHeader },
    });
};

const postboksResponse = async (
    postnrData: PostnrData
): Promise<PostnrSearchResult> => {
    const geoIds = postnrData.bydeler?.map((bydel) => bydel.bydelsnr) || [
        postnrData.kommunenr,
    ];

    const hits = [];

    for (const id in geoIds) {
        const officeInfo = await fetchOfficeInfoByGeoId(id);
        if (officeInfo) {
            hits.push(officeInfo);
        }
    }

    return {
        hits,
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
        type: 'postnr',
    };
};

const adresseResponse = (
    postnrData: PostnrData,
    apiResponse: PostnrApiResponse
): PostnrSearchResult => {
    return {
        hits: apiResponse.hits,
        postnr: postnrData.postnr,
        poststed: postnrData.poststed,
        kategori: postnrData.kategori,
        type: 'postnr',
    };
};

export const responseFromPostnrSearch = async (
    postnr: string,
    res: NextApiResponse
) => {
    const postnrData = (await getPostnrRegister()).find(
        (item) => item.postnr === postnr
    );

    if (!postnrData) {
        return res.status(200).send([]);
    }

    if (
        postnrData.kategori === PostnrKategori.Postbokser ||
        postnrData.kategori === PostnrKategori.Servicepostnummer
    ) {
        return res.status(200).send(await postboksResponse(postnrData));
    }

    const apiRes = await fetchTpsPostnrSok(postnr);

    if (apiRes.error) {
        console.error(apiRes.message);
        return res.status(apiRes.statusCode).send(apiRes.message);
    }

    return res.status(200).send(adresseResponse(postnrData, apiRes));
};
