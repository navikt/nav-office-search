import { PostnrSearchResult } from '../../types/searchResult';
import { ErrorResponse } from '../server/fetch-utils';

const apiUrl = `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/postnr`;

export const fetchPostnrResult = (
    postnr: string
): Promise<PostnrSearchResult | ErrorResponse> =>
    fetch(`${apiUrl}/${postnr}`).then((res) => res.json());
