import { NextApiRequest, NextApiResponse } from 'next';
import { fetchTpsAdresseSok } from './fetch/postnr';
import {
    SearchResultErrorProps,
    SearchResultPostnrProps,
} from '../types/searchResult';
import {
    apiErrorResponse,
    officeInfoFromAdresseSokResponse,
    sortOfficeNames,
} from './utils';
import { getPostnrData } from './data/data';

export const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultPostnrProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const [postnr, ...adresseSegments] = query?.split(' ');

    const postnrData = await getPostnrData(postnr);

    if (!postnrData) {
        return res.status(404).send(apiErrorResponse('errorInvalidPostnr'));
    }

    if (adresseSegments.length === 0) {
        return res.status(200).send({ type: 'postnr', ...postnrData });
    }

    const adresse = adresseSegments?.join(' ').trim();

    const adresseSokResponse = await fetchTpsAdresseSok(postnr, adresse);

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
        adresseQuery: adresse,
        officeInfo: officeInfo,
    });
};
