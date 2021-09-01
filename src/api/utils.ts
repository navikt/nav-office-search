import { LocaleStringId } from '../localization/LocaleString';
import { SearchResultErrorProps } from '../types/searchResult';

export const apiErrorResponse = (
    messageId: LocaleStringId
): SearchResultErrorProps => ({
    type: 'error',
    messageId,
});
