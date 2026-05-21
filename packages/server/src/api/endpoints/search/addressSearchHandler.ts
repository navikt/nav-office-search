import { sortOfficeNames } from '../../../utils/sort';
import { Request, Response } from 'express';
import { getPoststed } from '../../../data/poststeder';
import { apiErrorResponse } from '../../../utils/fetch';
import {
    fetchTpsAdresseSok,
    officeInfoFromAdresseSokResponse,
} from '../../../external/postnr';
import { fetchPdlAdresseSok } from '../../../external/adresse';

export const addressSearchHandler = async (req: Request, res: Response) => {
    const { query } = req.query;

    const adresseSokResponse = await fetchPdlAdresseSok(query as string);
    /*


    if (adresseSokResponse.error) {
        if (adresseSokResponse.statusCode >= 500) {
            console.error(
                `Server error while fetching postnr from query ${query} - ${adresseSokResponse.statusCode} ${adresseSokResponse.message}`
            );

            return res
                .status(adresseSokResponse.statusCode)
                .send(apiErrorResponse('errorServerError'));
        } else {
            console.log(
                `Error fetching postnr from query ${query} - ${adresseSokResponse.statusCode} ${adresseSokResponse.message}`
            );

            return res.status(200).send({
                ...poststedData,
                type: 'postnr',
                adresseQuery: `${gatenavn}${husnr ? ` ${husnr}` : ''}`,
                officeInfo: [],
            });
        }
    }

    const officeInfo =
        officeInfoFromAdresseSokResponse(adresseSokResponse).sort(
            sortOfficeNames
        );

        */

    return res.status(200).send({
        type: 'adresse',
        adresseQuery: query,
        ...adresseSokResponse,
    });
};
