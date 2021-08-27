import { errorResponse, ErrorResponse, fetchJson } from './utils';
import { NextApiResponse } from 'next';
import { fetchAccessToken } from './auth';
import { encodeBase64 } from '../utils';
import {
    getPostnrRegister,
    PostnrData,
    PostnrKategori,
} from '../data/postnrRegister';

const apiUrl = process.env.API_URL as string;

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
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
        console.error('Failed to fetch access token');
        return errorResponse(401, 'Failed to fetch access token', '');
    }

    const tokenBase64 = encodeBase64(accessToken.access_token);

    return await fetchJson(
        apiUrl,
        {
            postnr,
        },
        { headers: { Authorization: `Bearer ${tokenBase64}` } }
    );
};

const postboksResponse = (postnrData: PostnrData) => {
    return [];
};

export const responseFromPostnrSearch = async (
    postnr: string,
    res: NextApiResponse
) => {
    const postnrData = getPostnrRegister().find(
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
