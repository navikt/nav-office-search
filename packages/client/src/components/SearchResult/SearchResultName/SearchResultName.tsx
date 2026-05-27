import React, { Fragment } from 'react';
import { SearchResultNameProps } from '../../../../../common/types/results';
import { LocaleString } from '../../../localization/LocaleString';
import { BodyShort } from '@navikt/ds-react';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { HighlightedText } from '../../HighlightedText/HighlightedText';

import style from './SearchResultName.module.css';

type Props = {
    result: SearchResultNameProps;
    input: string;
};

export const SearchResultName = ({ result, input }: Props) => {
    const { input: resultInput, hits } = result;

    if (!hits) {
        return (
            <div>
                <LocaleString id={'errorInvalidResult'} />
            </div>
        );
    }

    const numHits = hits.length;

    return (
        <div>
            <div className={style.header}>
                {numHits === 0 ? (
                    <LocaleString id={'nameResultNone'} args={[resultInput]} />
                ) : (
                    <LocaleString id={'nameResultFound'} args={[resultInput, numHits.toString()]} />
                )}
            </div>
            {hits.map((nameHit) => (
                <Fragment key={nameHit.name}>
                    <BodyShort size={'medium'} className={style.hitname}>
                        <HighlightedText text={nameHit.name.toUpperCase()} input={input} />
                    </BodyShort>
                    {nameHit.officeHits.map((office) => (
                        <OfficeLink officeInfo={office} key={office.enhetNr} />
                    ))}
                </Fragment>
            ))}
        </div>
    );
};
