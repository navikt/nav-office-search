import { SearchResultErrorProps } from '../types/results';
import { LocaleStringId } from '../localization/nb-default';
import { OfficeInfo } from '../types/data';

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

export const sortOfficeNames = (a: OfficeInfo, b: OfficeInfo) =>
    norskSort(a.name, b.name);

export const norskSort = new Intl.Collator(['no', 'nb', 'nn'], {
    usage: 'sort',
}).compare;
