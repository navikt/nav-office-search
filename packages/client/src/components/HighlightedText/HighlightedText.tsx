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

type TextSegment = {
    text: string;
    isMatch: boolean;
    start: number;
    end: number;
};

const wordPattern = /[\p{L}\p{N}]+/gu;

const getInputTokens = (input: string) =>
    (input.match(wordPattern) ?? []).sort((left, right) => right.length - left.length);

const overlaps = (range: MatchRange, ranges: MatchRange[]) =>
    ranges.some(
        (existingRange) => range.start < existingRange.end && range.end > existingRange.start
    );

const getMatchRanges = (text: string, input: string): MatchRange[] => {
    const normalizedText = normalizeString(text);
    const ranges: MatchRange[] = [];

    for (const token of getInputTokens(input)) {
        const normalizedToken = normalizeString(token);

        if (!normalizedToken) {
            continue;
        }

        let matchStart = normalizedText.indexOf(normalizedToken);

        while (matchStart !== -1) {
            const range = { start: matchStart, end: matchStart + normalizedToken.length };

            if (!overlaps(range, ranges)) {
                ranges.push(range);
            }

            matchStart = normalizedText.indexOf(normalizedToken, matchStart + 1);
        }
    }

    return ranges.sort((left, right) => left.start - right.start);
};

const getTextSegments = (text: string, input: string): TextSegment[] => {
    const matchRanges = getMatchRanges(text, input);

    if (matchRanges.length === 0) {
        return [{ text, start: 0, end: text.length, isMatch: false }];
    }

    const segments = matchRanges.flatMap<TextSegment>((range, index) => {
        const previousEnd = matchRanges[index - 1]?.end ?? 0;
        const nonMatch =
            previousEnd < range.start
                ? [
                      {
                          text: text.slice(previousEnd, range.start),
                          start: previousEnd,
                          end: range.start,
                          isMatch: false,
                      },
                  ]
                : [];

        return [
            ...nonMatch,
            {
                text: text.slice(range.start, range.end),
                start: range.start,
                end: range.end,
                isMatch: true,
            },
        ];
    });
    const lastEnd = matchRanges[matchRanges.length - 1]?.end ?? 0;

    return lastEnd < text.length
        ? [
              ...segments,
              { text: text.slice(lastEnd), start: lastEnd, end: text.length, isMatch: false },
          ]
        : segments;
};

export const HighlightedText = ({ text, input }: Props) => {
    const segments = getTextSegments(text, input);

    return (
        <span>
            {segments.map((segment) =>
                segment.isMatch ? (
                    <strong key={`${segment.start}-${segment.end}`}>{segment.text}</strong>
                ) : (
                    <Fragment key={`${segment.start}-${segment.end}`}>{segment.text}</Fragment>
                )
            )}
        </span>
    );
};
