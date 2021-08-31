import { PostnrSearchResult } from '../../types/searchResult';

const apiUrl = `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/postnr`;

export const fetchPostnrResult = (
    postnr: string
): Promise<PostnrSearchResult> =>
    fetch(`${apiUrl}/${postnr}`).then((res) => res.json());
