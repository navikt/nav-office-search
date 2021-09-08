import React, { Fragment } from 'react';
import { SearchResultPostnrProps } from '../../../types/searchResult';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { BodyShort } from '@navikt/ds-react';
import { PostnrKategori } from '../../../types/postnr';
import style from './SearchResultPostnr.module.css';

const HeaderText = (result: SearchResultPostnrProps) => {
    const {
        postnr,
        poststed,
        kommuneNavn,
        kategori,
        officeInfo,
        adresseQuery,
    } = result;

    const postnrOgPoststed = <strong>{`${postnr} ${poststed}`}</strong>;

    const numHits = officeInfo.length;

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
                <strong>{kommuneNavn}</strong>
                {` kommune. Kommunens NAV-kontor:`}
            </>
        );
    }

    if (kategori === PostnrKategori.Servicepostnummer) {
        return (
            <>
                {`${postnr} er et servicepostnummer i `}
                <strong>{kommuneNavn}</strong>
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
    const { officeInfo, adresseQuery } = result;

    if (!officeInfo) {
        return <div>{'Error in search results'}</div>;
    }

    return (
        <div className={style.container}>
            <div className={style.header}>
                <HeaderText {...result} />
            </div>
            {officeInfo.map((hit) => (
                <Fragment key={hit.enhetNr}>
                    {adresseQuery && (
                        <BodyShort size={'s'}>{`${hit.hitString}:`}</BodyShort>
                    )}
                    <OfficeLink officeInfo={hit} />
                </Fragment>
            ))}
        </div>
    );
};
