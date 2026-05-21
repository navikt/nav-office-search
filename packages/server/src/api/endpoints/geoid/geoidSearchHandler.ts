import { Request, Response } from 'express';
import { PostnrKategori } from '../../../../../common/types/data';
import { fetchOfficeInfoByGeoId } from '../../../external/officeInfo';
import { apiErrorResponse } from '../../../utils/fetch';

export const geoidSearchHandler = async (req: Request, res: Response) => {
    const { id } = req.query;

    if (typeof id !== 'string' || !id.trim()) {
        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    }

    const officeInfo = await fetchOfficeInfoByGeoId(id.trim());

    if (officeInfo.error) {
        console.error(`Error fetching office info for geoid ${id}: ${officeInfo.message}`);
        return res.status(officeInfo.statusCode).send(apiErrorResponse('errorServerError'));
    }

    return res.status(200).send({
        type: 'postnr',
        postnr: '',
        poststed: officeInfo.name,
        poststedNormalized: '',
        kommuneNavn: '',
        kommunenr: id.trim(),
        kategori: PostnrKategori.Gateadresser,
        officeInfo: [officeInfo],
    });
};
