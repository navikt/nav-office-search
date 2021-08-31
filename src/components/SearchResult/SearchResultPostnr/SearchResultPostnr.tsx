import React from 'react';
import { PostnrResult, SearchHitProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';

const getUrl = () => 'https://www.nav.no';

type Props = {
    result: PostnrResult;
};

export const SearchResultPostnr = ({ result }: Props) => {
    const { postnr, poststed, postnrType, hits } = result;

    return (
        <div>
            <div>
                {`NAV-kontor for `}
                <strong>{`${postnr} ${poststed}:`}</strong>
            </div>
            {hits.map((hit) => (
                <OfficeLink href={getUrl()} name={hit.kontorNavn} />
            ))}
        </div>
    );
};
