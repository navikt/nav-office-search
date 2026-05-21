import { Request, Response } from 'express';
import { PostnrKategori } from '../../../../../common/types/data';
import { fetchOfficeInfoByGeoId } from '../../../external/officeInfo';
import { apiErrorResponse } from '../../../utils/fetch';

export const geoidSearchHandler = async (req: Request, res: Response) => {
    const { id } = req.query;

    if (typeof id !== 'string' || !id.trim()) {
        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    }

    const trimmedId = id.trim();
    const safeIdForLog = trimmedId.replace(/[\r\n]/g, '');
    const officeInfo = await fetchOfficeInfoByGeoId(trimmedId);

    if (officeInfo.error) {
        console.error(`Error fetching office info for geoid ${safeIdForLog}: ${officeInfo.message}`);
        return res.status(officeInfo.statusCode).send(apiErrorResponse('errorServerError'));
    }

    return res.status(200).send({
        type: 'postnr',
        postnr: '',
        poststed: officeInfo.name,
        poststedNormalized: '',
        kommuneNavn: '',
        kommunenr: trimmedId,
        kategori: PostnrKategori.Gateadresser,
        officeInfo: [officeInfo],
    });
};
