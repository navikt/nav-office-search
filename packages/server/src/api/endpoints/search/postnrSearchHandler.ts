import { Poststed } from '../../../../../common/types/data';
import { SearchResultPostnrProps } from '../../../../../common/types/results';
import { getBydelerForKommune } from '../../../data/bydeler';
import { removeDuplicates } from '../../../utils/removeDuplicates';
import { sortOfficeNames } from '../../../utils/sort';
import { Request, Response } from 'express';
import { getPoststed } from '../../../data/poststeder';
import { apiErrorResponse } from '../../../utils/fetch';

const responseDataWithBydeler = (poststedData: Poststed): SearchResultPostnrProps => {
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

    const postnr = query.trim();

    const poststedData = await getPoststed(postnr);

    if (!poststedData) {
        return res.status(404).send(apiErrorResponse('errorInvalidPostnr'));
    }

    if (poststedData.officeInfo.length > 0) {
        return res.status(200).send({ ...poststedData, type: 'postnr' });
    }

    return res.status(200).send(responseDataWithBydeler(poststedData));
};
