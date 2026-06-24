import { Request, Response } from 'express';
import { apiErrorResponse } from '../../../utils/fetch';
import { AdresseSokResponse, fetchPdlAdresseSok } from '../../../external/adresse';
import { isDataLoaded, loadData } from '../../../data/data';
import { SearchResultAdresseProps } from '../../../../../common/types/results';

const toAddressSearchResult = (
    adresseQuery: string,
    response: AdresseSokResponse
): SearchResultAdresseProps => {
    return {
        type: 'adresse',
        adresseQuery,
        adresser: response.adresser,
        totalHits: response.totalHits,
    };
};

export const addressSearchHandler = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        if (typeof query !== 'string' || !query.trim()) {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        if (!isDataLoaded()) {
            await loadData();
        }

        const adresseSokResponse = await fetchPdlAdresseSok(query);

        if ('error' in adresseSokResponse) {
            console.error(
                `Address search failed for query ${query.replace(/[\r\n]/g, '')}: ${adresseSokResponse.message}`
            );

            return res
                .status(adresseSokResponse.statusCode)
                .send(apiErrorResponse('errorServerError'));
        }

        const searchResult = toAddressSearchResult(query, adresseSokResponse);

        return res.status(200).send(searchResult);
    } catch (e) {
        console.error(`Address search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};
