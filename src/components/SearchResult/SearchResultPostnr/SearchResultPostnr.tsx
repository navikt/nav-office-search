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

    const numHits = hits.length;

    const postnrOgPoststed = <strong>{`${postnr} ${poststed}`}</strong>;

    return (
        <div className={style.container}>
            {numHits > 0 ? (
                <>
                    {numHits > 1 ? (
                        <div>
                            {`${numHits} kontorer dekker `}
                            {postnrOgPoststed}
                            {
                                'Du kan skrive inn et gatenavn for å filtrere søket (coming soon!)'
                            }
                        </div>
                    ) : (
                        <div className={style.header}>
                            {`NAV-kontor for `}
                            {postnrOgPoststed}
                        </div>
                    )}
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
                    {postnrOgPoststed}
                </div>
            )}
        </div>
    );
};
