import { NextApiResponse } from 'next';
import { errorResponse, ErrorResponse, fetchJson } from './fetch-utils';
import { getAuthorizationHeader } from './auth';
import {
    getPostnrRegister,
    PostnrData,
    PostnrKategori,
} from '../../data/postnrRegister';
import { SearchHitProps } from '../../types/searchHitProps';

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

const postboksResponse = (postnrData: PostnrData) => {
    return [postnrData.kommunenr];
};

export const responseFromPostnrSearch = async (
    postnr: string,
    res: NextApiResponse
) => {
    const postnrData = (await getPostnrRegister()).find(
        (item) => item.postnr === postnr
    );

    console.log(postnrData);

    if (!postnrData) {
        return res.status(200).send([]);
    }

    if (
        postnrData.kategori === PostnrKategori.Postbokser ||
        postnrData.kategori === PostnrKategori.Servicepostnummer
    ) {
        return res.status(200).send(postboksResponse(postnrData));
    }

    const apiRes = await fetchTpsPostnrSok(postnr);

    if (apiRes.error) {
        console.error(apiRes.message);
        return res.status(apiRes.statusCode).send(apiRes.message);
    }

    return res.status(200).send(apiRes);
};
