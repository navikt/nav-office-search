import React, { Fragment } from 'react';
import { SearchResultPostnrProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { BodyLong } from '@navikt/ds-react';
import { PostnrKategori } from '../../../types/postnr';
import style from './SearchResultPostnr.module.css';

const getUrl = () => 'https://www.nav.no';

const HeaderText = (result: SearchResultPostnrProps) => {
    const { postnr, poststed, kommune, kategori, hits, adresseQuery } = result;

    const postnrOgPoststed = <strong>{`${postnr} ${poststed}`}</strong>;

    const numHits = hits.length;

    if (numHits === 0) {
        return (
            <>
                {`Ingen NAV-kontor funnet for `}
                {postnrOgPoststed}
                {adresseQuery && ` med gatenavn ${adresseQuery}`}
            </>
        );
    }

    if (kategori === PostnrKategori.Postbokser) {
        return (
            <>
                {`${postnr} er et postnummer for postbokser i `}
                <strong>{kommune}</strong>
                {` kommune. Kommunens NAV-kontor:`}
            </>
        );
    }

    if (kategori === PostnrKategori.Servicepostnummer) {
        return (
            <>
                {`${postnr} er et servicepostnummer i `}
                <strong>{kommune}</strong>
                {` kommune. Kommunens NAV-kontor:`}
            </>
        );
    }

    if (numHits > 1) {
        return (
            <>
                {`${numHits} kontorer dekker `}
                {postnrOgPoststed}
                {`. Du kan legge til et gatenavn for å filtrere søket, f.eks. ${postnr} Eksempelgata`}
            </>
        );
    }

    return (
        <>
            {`NAV-kontor for `}
            {postnrOgPoststed}
            {':'}
        </>
    );
};

type Props = {
    result: SearchResultPostnrProps;
};

export const SearchResultPostnr = ({ result }: Props) => {
    const { hits, adresseQuery } = result;

    if (!hits) {
        return <div>{'Error in search results'}</div>;
    }

    return (
        <div className={style.container}>
            <div className={style.header}>
                <HeaderText {...result} />
            </div>
            {hits.map((hit) => (
                <Fragment key={hit.enhetNr}>
                    {adresseQuery && (
                        <BodyLong>{`${hit.adressenavn}:`}</BodyLong>
                    )}
                    <OfficeLink href={getUrl()} name={hit.kontorNavn} />
                </Fragment>
            ))}
        </div>
    );
};
