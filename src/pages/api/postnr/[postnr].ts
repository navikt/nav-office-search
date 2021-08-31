import { NextApiRequest, NextApiResponse } from 'next';
import {
    getPostnrRegister,
    PostnrData,
    PostnrKategori,
} from '../../../data/postnrRegister';
import {
    PostnrSearchResult,
    SearchHitProps,
} from '../../../types/searchResult';
import { fetchOfficeInfoByGeoId } from '../../../fetch/server/office-info';
import {
    fetchTpsAdresseSok,
    PostnrApiResponse,
} from '../../../fetch/server/postnr';
import { errorResponse } from '../../../fetch/server/fetch-utils';

const postboksResponse = async (
    postnrData: PostnrData
): Promise<PostnrSearchResult> => {
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

const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    const { postnr, adresse } = req.query;

    if (typeof postnr !== 'string') {
        return res
            .status(400)
            .json({ message: 'postnr parameter missing or invalid' });
    }

    const postnrData = (await getPostnrRegister()).find(
        (item) => item.postnr === postnr
    );

    if (!postnrData) {
        return res.status(404).send(errorResponse(404, 'Invalid postnr'));
    }

    if (
        postnrData.kategori === PostnrKategori.Postbokser ||
        postnrData.kategori === PostnrKategori.Servicepostnummer
    ) {
        return res.status(200).send(await postboksResponse(postnrData));
    }

    const adresseSokRes = await fetchTpsAdresseSok(
        postnr,
        typeof adresse === 'string' ? adresse : undefined
    );

    if (adresseSokRes.error) {
        console.error(adresseSokRes.message);
        return res.status(adresseSokRes.statusCode).send(adresseSokRes.message);
    }

    return res.status(200).send(adresseResponse(postnrData, adresseSokRes));
};

export default postnrSearchHandler;
