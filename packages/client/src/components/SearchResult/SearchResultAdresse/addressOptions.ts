import { AppLocale } from '../../../../../common/localization/types';
import { localeString } from '../../../../../common/localization/localeString';
import { Adresse, SearchResultAdresseProps } from '../../../../../common/types/results';

export const maxVisibleAddressOptions = 6;

export const formatAddressLabel = (adresse: Adresse) => {
    const { adressenavn, husnummer, husbokstav, postnummer, poststed } = adresse.vegadresse;

    return `${adressenavn} ${husnummer}${husbokstav ?? ''}, ${postnummer} ${poststed}`;
};

type MatchRange = {
    start: number;
    end: number;
};

type LabelWord = MatchRange & {
    text: string;
};

export type AddressLabelSegment = {
    text: string;
    isMatch: boolean;
};

const wordPattern = /[\p{L}\p{N}]+/gu;

const normalize = (value: string) => value.toLocaleLowerCase();

const overlaps = (range: MatchRange, ranges: MatchRange[]) =>
    ranges.some((existingRange) => range.start < existingRange.end && range.end > existingRange.start);

const getLabelWords = (label: string): LabelWord[] =>
    Array.from(label.matchAll(wordPattern), (match) => ({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
    }));

const getQueryTokens = (query: string) => query.match(wordPattern) ?? [];

const findExactRange = (label: string, token: string, selectedRanges: MatchRange[]) => {
    const normalizedLabel = normalize(label);
    const normalizedToken = normalize(token);
    let matchStart = normalizedLabel.indexOf(normalizedToken);

    while (matchStart !== -1) {
        const range = { start: matchStart, end: matchStart + token.length };

        if (!overlaps(range, selectedRanges)) {
            return range;
        }

        matchStart = normalizedLabel.indexOf(normalizedToken, matchStart + 1);
    }

    return null;
};

const levenshteinDistance = (left: string, right: string) => {
    const distances = Array.from({ length: left.length + 1 }, (_, index) => index);

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        let previousDistance = distances[0];
        distances[0] = rightIndex;

        for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
            const currentDistance = distances[leftIndex];
            const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

            distances[leftIndex] = Math.min(
                distances[leftIndex] + 1,
                distances[leftIndex - 1] + 1,
                previousDistance + substitutionCost
            );
            previousDistance = currentDistance;
        }
    }

    return distances[left.length];
};

const isSubsequence = (needle: string, haystack: string) => {
    let needleIndex = 0;

    for (const character of haystack) {
        if (character === needle[needleIndex]) {
            needleIndex += 1;
        }

        if (needleIndex === needle.length) {
            return true;
        }
    }

    return false;
};

const findFuzzyWordRange = (
    labelWords: LabelWord[],
    token: string,
    selectedRanges: MatchRange[]
) => {
    const normalizedToken = normalize(token);

    if (normalizedToken.length < 4) {
        return null;
    }

    return (
        labelWords.find((word) => {
            if (overlaps(word, selectedRanges)) {
                return false;
            }

            const normalizedWord = normalize(word.text);

            return (
                levenshteinDistance(normalizedToken, normalizedWord) <= 1 ||
                isSubsequence(normalizedToken, normalizedWord)
            );
        }) ?? null
    );
};

const addSegment = (segments: AddressLabelSegment[], text: string, isMatch: boolean) => {
    if (text.length > 0) {
        segments.push({ text, isMatch });
    }
};

export const getAddressLabelSegments = (label: string, query: string): AddressLabelSegment[] => {
    const queryTokens = getQueryTokens(query);

    if (queryTokens.length === 0) {
        return [{ text: label, isMatch: false }];
    }

    const labelWords = getLabelWords(label);
    const selectedRanges = queryTokens.reduce<MatchRange[]>((ranges, token) => {
        const range =
            findExactRange(label, token, ranges) ??
            findFuzzyWordRange(labelWords, token, ranges);

        return range ? [...ranges, range] : ranges;
    }, []);

    if (selectedRanges.length === 0) {
        return [{ text: label, isMatch: false }];
    }

    return [...selectedRanges]
        .sort((left, right) => left.start - right.start)
        .reduce<AddressLabelSegment[]>((segments, range, index, ranges) => {
            const previousRange = ranges[index - 1];
            const previousEnd = previousRange?.end ?? 0;

            addSegment(segments, label.slice(previousEnd, range.start), false);
            addSegment(segments, label.slice(range.start, range.end), true);

            if (index === ranges.length - 1) {
                addSegment(segments, label.slice(range.end), false);
            }

            return segments;
        }, []);
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

export const getAddressSuggestionsRefineMessage = (
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
