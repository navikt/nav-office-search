import React, { Fragment } from 'react';
import { normalizeString } from '../../../../common/normalizeString';

type Props = {
    text: string;
    input: string;
};

type MatchRange = {
    start: number;
    end: number;
};

type TextWord = MatchRange & {
    text: string;
};

type TextSegment = {
    text: string;
    isMatch: boolean;
};

const wordPattern = /[\p{L}\p{N}]+/gu;

const overlaps = (range: MatchRange, ranges: MatchRange[]) =>
    ranges.some(
        (existingRange) => range.start < existingRange.end && range.end > existingRange.start
    );

const getTextWords = (text: string): TextWord[] =>
    Array.from(text.matchAll(wordPattern), (match) => ({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
    }));

const getInputTokens = (input: string) => input.match(wordPattern) ?? [];

const findExactRange = (text: string, token: string, selectedRanges: MatchRange[]) => {
    const normalizedText = normalizeString(text);
    const normalizedToken = normalizeString(token);
    let matchStart = normalizedText.indexOf(normalizedToken);

    while (matchStart !== -1) {
        const range = { start: matchStart, end: matchStart + normalizedToken.length };

        if (!overlaps(range, selectedRanges)) {
            return range;
        }

        matchStart = normalizedText.indexOf(normalizedToken, matchStart + 1);
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

const findFuzzyWordRange = (textWords: TextWord[], token: string, selectedRanges: MatchRange[]) => {
    const normalizedToken = normalizeString(token);

    if (normalizedToken.length < 4) {
        return null;
    }

    return (
        textWords.find((word) => {
            if (overlaps(word, selectedRanges)) {
                return false;
            }

            const normalizedWord = normalizeString(word.text);

            return (
                levenshteinDistance(normalizedToken, normalizedWord) <= 1 ||
                isSubsequence(normalizedToken, normalizedWord)
            );
        }) ?? null
    );
};

const addSegment = (segments: TextSegment[], text: string, isMatch: boolean) => {
    if (text.length > 0) {
        segments.push({ text, isMatch });
    }
};

const getTextSegments = (text: string, input: string): TextSegment[] => {
    const inputTokens = getInputTokens(input);

    if (inputTokens.length === 0) {
        return [{ text, isMatch: false }];
    }

    const textWords = getTextWords(text);
    const selectedRanges = inputTokens.reduce<MatchRange[]>((ranges, token) => {
        const range =
            findExactRange(text, token, ranges) ?? findFuzzyWordRange(textWords, token, ranges);

        return range ? [...ranges, range] : ranges;
    }, []);

    if (selectedRanges.length === 0) {
        return [{ text, isMatch: false }];
    }

    return [...selectedRanges]
        .sort((left, right) => left.start - right.start)
        .reduce<TextSegment[]>((segments, range, index, ranges) => {
            const previousRange = ranges[index - 1];
            const previousEnd = previousRange?.end ?? 0;

            addSegment(segments, text.slice(previousEnd, range.start), false);
            addSegment(segments, text.slice(range.start, range.end), true);

            if (index === ranges.length - 1) {
                addSegment(segments, text.slice(range.end), false);
            }

            return segments;
        }, []);
};

export const HighlightedText = ({ text, input }: Props) => {
    const segments = getTextSegments(text, input);

    return (
        <span>
            {segments.map((segment, index) =>
                segment.isMatch ? (
                    <strong key={index}>{segment.text}</strong>
                ) : (
                    <Fragment key={index}>{segment.text}</Fragment>
                )
            )}
        </span>
    );
};
