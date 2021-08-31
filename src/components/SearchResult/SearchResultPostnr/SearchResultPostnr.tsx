import React from 'react';
import { PostnrSearchResult } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import style from './SearchResultPostnr.module.css';

const getUrl = () => 'https://www.nav.no';

type Props = {
    result: PostnrSearchResult;
};

export const SearchResultPostnr = ({ result }: Props) => {
    const { postnr, poststed, kategori, hits } = result;

    return (
        <div className={style.container}>
            {hits.length > 0 ? (
                <>
                    <div className={style.header}>
                        {`NAV-kontor for `}
                        <strong>{`${postnr} ${poststed}:`}</strong>
                    </div>
                    {hits.map((hit) => (
                        <OfficeLink
                            href={getUrl()}
                            name={hit.kontorNavn}
                            key={hit.enhetNr}
                        />
                    ))}
                </>
            ) : (
                <div className={style.header}>
                    {`Ingen NAV-kontor funnet for `}
                    <strong>{`${postnr} ${poststed}`}</strong>
                </div>
            )}
        </div>
    );
};
