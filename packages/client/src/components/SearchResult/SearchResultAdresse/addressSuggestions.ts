import { AppLocale } from '../../../../../common/localization/types';
import { localeString } from '../../../../../common/localization/localeString';
import { Adresse, SearchResultAdresseProps } from '../../../../../common/types/results';

export const maxVisibleAddressOptions = 6;

export const formatAddressLabel = (adresse: Adresse) => {
    const { adressenavn, husnummer, husbokstav, postnummer, poststed } = adresse.vegadresse;

    return `${adressenavn} ${husnummer}${husbokstav ?? ''}, ${postnummer} ${poststed}`;
};

export const getAddressOptionId = (listboxId: string, index: number) =>
    `${listboxId}-option-${index}`;

export const getAddressSuggestionCounts = (result: SearchResultAdresseProps) => {
    const visibleHits = result.sokAdresse.hits.length;
    const totalHits = Math.max(result.sokAdresse.totalHits, visibleHits);

    return {
        visibleHits,
        totalHits,
        hasMoreThanVisibleRows: totalHits > maxVisibleAddressOptions,
    };
};

const getAddressSuggestionsRefineMessage = (
    result: SearchResultAdresseProps,
    locale: AppLocale
) => {
    const { visibleHits, totalHits, hasMoreThanVisibleRows } = getAddressSuggestionCounts(result);

    return hasMoreThanVisibleRows
        ? (localeString('addressSuggestionsRefine', locale, [
              visibleHits.toString(),
              totalHits.toString(),
          ]) as string)
        : '';
};

export const getAddressSuggestionsStatusMessage = (
    result: SearchResultAdresseProps,
    locale: AppLocale
) => {
    const { visibleHits } = getAddressSuggestionCounts(result);

    if (visibleHits === 0) {
        return localeString('nameResultNone', locale, [result.adresseQuery]) as string;
    }

    const availableMessage = localeString('addressSuggestionsAvailable', locale, [
        visibleHits.toString(),
    ]) as string;
    const refineMessage = getAddressSuggestionsRefineMessage(result, locale);

    return refineMessage ? `${availableMessage} ${refineMessage}` : availableMessage;
};
