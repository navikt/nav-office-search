import { SearchResultProps } from '../../types/searchResult';
import { objectToQueryString } from '../../utils/fetch';

const apiUrl = `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/search`;

export const fetchSearchResult = (query: string): Promise<SearchResultProps> =>
    fetch(
        `${apiUrl}${objectToQueryString({
            query,
        })}`
    ).then((res) => res.json());
