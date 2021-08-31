import React from 'react';
import { NameSearchResult } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';

const getUrl = () => 'https://www.nav.no';

type Props = {
    result: NameSearchResult;
};

export const SearchResultName = ({ result }: Props) => {
    const { input, hits } = result;

    return (
        <div>
            <div>
                {`NAV-kontor for `}
                <strong>{input}</strong>
            </div>
            {hits.map((hit) => (
                <OfficeLink
                    href={getUrl()}
                    name={hit.kontorNavn}
                    key={hit.enhetNr}
                />
            ))}
        </div>
    );
};
