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

const getGatenavnAndHusnr = (adresseSegments: string[]) => {
    const husnr = adresseSegments.slice(-1)[0];
    if (isNaN(Number(husnr))) {
        return [adresseSegments.join(' ')];
    }

    return [adresseSegments.slice(0, -1).join(' '), husnr];
};

export const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultPostnrProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const [postnr, ...adresseSegments] = query?.trim().split(' ');

    const postnrData = await getPoststed(postnr);

    if (!postnrData) {
        return res.status(404).send(apiErrorResponse('errorInvalidPostnr'));
    }

    if (adresseSegments.length === 0) {
        return res.status(200).send({ type: 'postnr', ...postnrData });
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
        }
    }

    const officeInfo = adresseSokResponse.error
        ? []
        : officeInfoFromAdresseSokResponse(adresseSokResponse).sort(
              sortOfficeNames
          );

    return res.status(200).send({
        ...postnrData,
        type: 'postnr',
        adresseQuery: `${gatenavn}${husnr ? ` ${husnr}` : ''}`,
        officeInfo: officeInfo,
    });
};
