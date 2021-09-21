import { NextApiRequest, NextApiResponse } from 'next';
import {
    fetchTpsAdresseSok,
    officeInfoFromAdresseSokResponse,
} from './fetch/postnr';
import {
    SearchResultErrorProps,
    SearchResultPostnrProps,
} from '../types/results';
import { apiErrorResponse, sortOfficeNames } from './utils';
import { getPoststed } from './data/poststeder';
import { getBydelerForKommune } from './data/bydeler';
import { Poststed } from '../types/data';

const getGatenavnAndHusnr = (adresseSegments: string[]) => {
    const husnr = adresseSegments.slice(-1)[0];
    if (isNaN(Number(husnr))) {
        return [adresseSegments.join(' ')];
    }

    return [adresseSegments.slice(0, -1).join(' '), husnr];
};

const responseDataWithBydeler = (
    poststedData: Poststed
): SearchResultPostnrProps => {
    const bydeler = getBydelerForKommune(poststedData.kommunenr);

    if (!bydeler) {
        return { ...poststedData, type: 'postnr' };
    }

    return {
        ...poststedData,
        type: 'postnr',
        withAllBydeler: true,
        officeInfo: bydeler.map((bydel) => bydel.officeInfo),
    };
};

export const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultPostnrProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const [postnr, ...adresseSegments] = query?.trim().split(' ');

    const poststedData = await getPoststed(postnr);

    if (!poststedData) {
        return res.status(404).send(apiErrorResponse('errorInvalidPostnr'));
    }

    if (adresseSegments.length === 0) {
        if (poststedData.officeInfo.length > 0) {
            return res.status(200).send({ ...poststedData, type: 'postnr' });
        }

        return res.status(200).send(responseDataWithBydeler(poststedData));
    }

    const [gatenavn, husnr] = getGatenavnAndHusnr(adresseSegments);

    const adresseSokResponse = await fetchTpsAdresseSok(
        postnr,
        gatenavn,
        husnr
    );

    if (adresseSokResponse.error) {
        console.error(
            `Error fetching postnr from query ${query} - ${adresseSokResponse.statusCode} ${adresseSokResponse.message}`
        );

        if (adresseSokResponse.statusCode >= 500) {
            return res
                .status(adresseSokResponse.statusCode)
                .send(apiErrorResponse('errorServerError'));
        } else {
            return responseDataWithBydeler(poststedData);
        }
    }

    const officeInfo =
        officeInfoFromAdresseSokResponse(adresseSokResponse).sort(
            sortOfficeNames
        );

    return res.status(200).send({
        ...poststedData,
        type: 'postnr',
        adresseQuery: `${gatenavn}${husnr ? ` ${husnr}` : ''}`,
        officeInfo: officeInfo,
    });
};
