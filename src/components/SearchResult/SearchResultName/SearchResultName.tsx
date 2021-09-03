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

type Props = {
    result: SearchResultNameProps;
};

export const SearchResultName = ({ result }: Props) => {
    const { input, hits } = result;

    if (!hits) {
        return <div>{'Error in search results'}</div>;
    }

    const numHits = hits.length;
    const normalizedInput = normalizeString(input);

    return (
        <div>
            <div className={style.header}>
                {numHits === 0
                    ? `Ingen resultater for "${input}"`
                    : `Søkeresultat for "${input}" (${numHits}):`}
            </div>
            {hits.map((hit) => (
                <Fragment key={hit.enhetNr}>
                    <BodyShort size={'s'} className={style.hitname}>
                        <NameWithHighlightedInput
                            name={hit.adressenavn}
                            normalizedInput={normalizedInput}
                        />
                    </BodyShort>
                    <OfficeLink href={getUrl()} name={hit.kontorNavn} />
                </Fragment>
            ))}
        </div>
    );
};
