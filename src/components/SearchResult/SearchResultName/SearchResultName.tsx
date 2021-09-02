import React, { Fragment } from 'react';
import { SearchResultNameProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { LocaleString } from '../../../localization/LocaleString';
import style from './SearchResultName.module.css';

const getUrl = () => 'https://www.nav.no';

type Props = {
    result: SearchResultNameProps;
};

export const SearchResultName = ({ result }: Props) => {
    const { input, hits } = result;

    return (
        <div>
            <div>
                <LocaleString id={'nameResultHeader'} />
                <strong>{input}</strong>
            </div>
            {hits.map((hit) => (
                <Fragment key={hit.enhetNr}>
                    {hit.adressenavn}
                    <OfficeLink href={getUrl()} name={hit.kontorNavn} />
                </Fragment>
            ))}
        </div>
    );
};
