import React from 'react';
import { SearchResultPostnrProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import style from './SearchResultPostnr.module.css';

const getUrl = () => 'https://www.nav.no';

type Props = {
    result: SearchResultPostnrProps;
};

export const SearchResultPostnr = ({ result }: Props) => {
    const { postnr, poststed, kategori, hits } = result;

    if (!hits) {
        return <div>{'Error in search results'}</div>;
    }

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
                            {`. Du kan legge til et gatenavn for å filtrere søket, f.eks. ${postnr} Eksempelgata`}
                        </div>
                    ) : (
                        <div className={style.header}>
                            {`NAV-kontor for `}
                            {postnrOgPoststed}
                            {':'}
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
