import React, { Fragment } from 'react';
import { SearchResultNameProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { normalizeString } from '../../../utils';
import { BodyShort } from '@navikt/ds-react';
import style from './SearchResultName.module.css';

const getUrl = () => 'https://www.nav.no';

const NameWithHighlightedInput = ({
    name,
    normalizedInput,
}: {
    name: string;
    normalizedInput: string;
}) => {
    const normalizedName = normalizeString(name);
    const startIndex = normalizedName.indexOf(normalizedInput);
    if (startIndex === -1) {
        console.log('Something is wrong...');
        return <>{name}</>;
    }

    const preMatch = name.slice(0, startIndex);
    const inputMatch = name.slice(
        startIndex,
        startIndex + normalizedInput.length
    );
    const postMatch = name.slice(startIndex + normalizedInput.length);

    return (
        <>
            {preMatch}
            <strong>{inputMatch}</strong>
            {postMatch}
        </>
    );
};

const sortNamesearch = (queryNormalized: string) => (a: string, b: string) => {
    const aNormalized = normalizeString(a);
    const bNormalized = normalizeString(b);

    const aStartsWithInput = aNormalized.startsWith(queryNormalized);
    const bStartsWithInput = bNormalized.startsWith(queryNormalized);

    if (aStartsWithInput && !bStartsWithInput) {
        return -1;
    }

    if (!aStartsWithInput && bStartsWithInput) {
        return 1;
    }

    return a === b ? 0 : a > b ? 1 : -1;
};

type Props = {
    result: SearchResultNameProps;
};

export const SearchResultName = ({ result }: Props) => {
    const { input, nameHits } = result;

    if (!nameHits) {
        return <div>{'Error in search results'}</div>;
    }

    const normalizedInput = normalizeString(input);
    const hitKeys = Object.keys(nameHits).sort(sortNamesearch(normalizedInput));
    const numHits = hitKeys.length;

    return (
        <div>
            <div className={style.header}>
                {numHits === 0
                    ? `Ingen resultater for "${input}"`
                    : `Søkeresultat for "${input}" (${numHits}):`}
            </div>
            {hitKeys.map((hitKey) => (
                <Fragment key={hitKey}>
                    <BodyShort size={'s'} className={style.hitname}>
                        <NameWithHighlightedInput
                            name={hitKey}
                            normalizedInput={normalizedInput}
                        />
                    </BodyShort>
                    {nameHits[hitKey].map((hit) => (
                        <OfficeLink
                            href={getUrl()}
                            name={hit.kontorNavn}
                            key={hit.enhetNr}
                        />
                    ))}
                </Fragment>
            ))}
        </div>
    );
};
