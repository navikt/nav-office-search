import { Request, Response } from 'express';
import { apiErrorResponse } from '../../../utils/fetch';
import { AdresseSokHit, AdresseSokResponse, fetchPdlAdresseSok } from '../../../external/adresse';
import { isDataLoaded, loadData } from '../../../data/data';
import { Adresse, SearchResultAdresseProps } from '../../../../../common/types/results';

const removeLeadingZeros = (str: string) => str.replace(/^0+/, '');

const legacyAddressHitToAdresse = (hit: AdresseSokHit): Adresse => {
    const husnummer = Number(removeLeadingZeros(hit.husnummerFra));
    const bydelsnummer =
        hit.bydel ??
        (hit.geografiskTilknytning === hit.kommunenummer ? null : hit.geografiskTilknytning);

    return {
        vegadresse: {
            adressenavn: hit.adressenavn,
            husnummer,
            husbokstav: null,
            postnummer: hit.postnummer,
            poststed: hit.poststed,
            kommunenummer: hit.kommunenummer,
            bydelsnummer,
        },
    };
};

const toAddressSearchResult = (
    adresseQuery: string,
    response: AdresseSokResponse
): SearchResultAdresseProps | null => {
    if (response.sokAdresse) {
        return {
            type: 'adresse',
            adresseQuery,
            sokAdresse: response.sokAdresse,
        };
    }

    if (response.hits) {
        const hits = response.hits.map(legacyAddressHitToAdresse);

        return {
            type: 'adresse',
            adresseQuery,
            sokAdresse: {
                hits,
                totalHits: hits.length,
            },
        };
    }

    return null;
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

        if (adresseSokResponse.error) {
            console.error(
                `Address search failed for query ${query.replace(/[\r\n]/g, '')}: ${adresseSokResponse.message}`
            );

            return res
                .status(adresseSokResponse.statusCode)
                .send(apiErrorResponse('errorServerError'));
        }

        const searchResult = toAddressSearchResult(query, adresseSokResponse);

        if (!searchResult) {
            console.error('Address search response did not match expected shape');
            return res.status(500).send(apiErrorResponse('errorInvalidResult'));
        }

        return res.status(200).send(searchResult);
    } catch (e) {
        console.error(`Address search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};
