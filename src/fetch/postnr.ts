import { errorResponse, ErrorResponse, fetchJson } from './utils';
import { NextApiResponse } from 'next';
import { fetchAccessToken } from './auth';

const apiUrl = process.env.API_URL as string;

export type SearchHit = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    hitString: string;
};

type TpsPostnrSokResponse = {
    error: undefined;
    hits: SearchHit[];
};

const fetchTpsPostnrSok = async (
    postnr: string
): Promise<TpsPostnrSokResponse | ErrorResponse> => {
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
        console.error('Failed to fetch access token');
        return errorResponse(401, 'Failed to fetch access token', '');
    }

    const tokenBase64 = new Buffer(accessToken).toString('base64');

    return await fetchJson(
        apiUrl,
        {
            postnr,
        },
        { headers: { Authorization: `Bearer ${tokenBase64}` } }
    );
};

const isPostbox = (postnr: string) => {
    return false;
};

const postboxResponse = () => [];

export const responseFromPostnrSearch = async (
    postnr: string,
    res: NextApiResponse
) => {
    if (isPostbox(postnr)) {
        return res.status(404).send('Postnummer er en postboks');
    }

    const apiRes = await fetchTpsPostnrSok(postnr);

    if (apiRes.error) {
        console.error(apiRes.message);
        return res.status(apiRes.statusCode).send(apiRes.message);
    }

    return res.status(200).send(apiRes.hits || []);
};
