import React from 'react';
import { normalizeString } from '../../../../common/normalizeString';

type Props = {
    text: string;
    input: string;
};

export const HighlightedText = ({ text, input }: Props) => {
    if (!input) {
        return <>{text}</>;
    }

    const normalizedText = normalizeString(text);
    const normalizedInput = normalizeString(input);

    if (normalizedInput.length === 0) {
        return <>{text}</>;
    }

    const startIndex = normalizedText.indexOf(normalizedInput);
    if (startIndex === -1) {
        return <>{text}</>;
    }

    const preMatch = text.slice(0, startIndex);
    const inputMatch = text.slice(startIndex, startIndex + normalizedInput.length);
    const postMatch = text.slice(startIndex + normalizedInput.length);

    return (
        <>
            {preMatch}
            <strong>{inputMatch}</strong>
            {postMatch}
        </>
    );
};
