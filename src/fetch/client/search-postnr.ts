import { SearchHitProps } from '../../types/searchHitProps';

const apiUrl = `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/postnr`;

export const fetchPostnrResult = (postnr: string): Promise<SearchHitProps[]> =>
    fetch(`${apiUrl}/${postnr}`)
        .then((res) => res.json())
        .then((json) => json.hits);
