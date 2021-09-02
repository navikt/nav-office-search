import { LocaleStringId } from '../localization/LocaleString';
import { SearchResultErrorProps } from '../types/searchResult';

export const apiErrorResponse = (
    messageId: LocaleStringId
): SearchResultErrorProps => ({
    type: 'error',
    messageId,
});

export const objectToQueryString = (params?: object, firstChar = '?') =>
    params
        ? Object.entries(params).reduce(
              (acc, [k, v], i) =>
                  v !== undefined
                      ? `${acc}${i ? '&' : firstChar}${k}=${encodeURIComponent(
                            typeof v === 'object' ? JSON.stringify(v) : v
                        )}`
                      : acc,
              ''
          )
        : '';
