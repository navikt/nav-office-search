import React, { Fragment } from 'react';
import { SearchResultNameProps } from '../../../types/results';
import { normalizeString } from '../../../utils/normalizeString';
import { LocaleString } from '../../../localization/LocaleString';
import { BodyShort } from '@navikt/ds-react';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import style from './SearchResultName.module.css';

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
        return (
            <div>
                <LocaleString id={'errorInvalidResult'} />
            </div>
        );
    }

    const normalizedInput = normalizeString(input);
    const numHits = hits.length;

    return (
        <div>
            <div className={style.header}>
                {numHits === 0 ? (
                    <LocaleString id={'nameResultNone'} args={[input]} />
                ) : (
                    <LocaleString
                        id={'nameResultFound'}
                        args={[input, numHits.toString()]}
                    />
                )}
            </div>
            {hits.map((nameHit) => (
                <Fragment key={nameHit.name}>
                    <BodyShort size={'medium'} className={style.hitname}>
                        <NameWithHighlightedInput
                            name={nameHit.name.toUpperCase()}
                            normalizedInput={normalizedInput}
                        />
                    </BodyShort>
                    {nameHit.officeHits.map((office) => (
                        <OfficeLink officeInfo={office} key={office.enhetNr} />
                    ))}
                </Fragment>
            ))}
        </div>
    );
};
