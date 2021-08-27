import { errorResponse, ErrorResponse, fetchJson } from './utils';
import { NextApiResponse } from 'next';
import { getAuthorizationHeader } from './auth';
import {
    getPostnrRegister,
    PostnrData,
    PostnrKategori,
} from '../data/postnrRegister';

const apiUrl = `${process.env.API_ORIGIN}/postnr`;

export type SearchHit = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    hitString: string;
};

type ApiResponse = {
    error: undefined;
    isPostboks: boolean;
    hits: SearchHit[];
};

const fetchTpsPostnrSok = async (
    postnr: string
): Promise<ApiResponse | ErrorResponse> => {
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
