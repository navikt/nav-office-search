import { Poststed } from '../../../../../common/types/data';
import { SearchResultPostnrProps } from '../../../../../common/types/results';
import { getBydelerForKommune } from '../../../data/bydeler';
import { removeDuplicates } from '../../../utils/removeDuplicates';
import { sortOfficeNames } from '../../../utils/sort';
import { Request, Response } from 'express';
import { getPoststed } from '../../../data/poststeder';
import { apiErrorResponse } from '../../../utils/fetch';
import {
    fetchTpsAdresseSok,
    officeInfoFromAdresseSokResponse,
} from '../../../external/postnr';

const getGatenavnAndHusnr = (adresseSegments: string[]) => {
    const husnrSegment = adresseSegments.slice(-1)[0];

    // Remove non-numbers from the potential husnr segment. Search for eg letter-postfixed
    // sub-units is not supported, we only want to search for the number itself
    const husnr = husnrSegment.replace(/[^0-9]/g, '');

    if (!husnr || isNaN(Number(husnr))) {
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

    const officeInfo = removeDuplicates(
        bydeler.map((bydel) => bydel.officeInfo),
        (a, b) => a.enhetNr === b.enhetNr
    ).sort(sortOfficeNames);

    return {
        ...poststedData,
        type: 'postnr',
        withAllBydeler: true,
        officeInfo,
    };
};

export const postnrSearchHandler = async (req: Request, res: Response) => {
    const { query } = req.query;

    if (typeof query !== 'string') {
        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    }

    const [postnr, ...adresseSegments] = query.trim().split(' ');

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
        poststedData.kommunenr,
        gatenavn,
        husnr
    );

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

    return res.status(200).send({
        ...poststedData,
        type: 'postnr',
        adresseQuery: `${gatenavn}${husnr ? ` ${husnr}` : ''}`,
        officeInfo: officeInfo,
    });
};
