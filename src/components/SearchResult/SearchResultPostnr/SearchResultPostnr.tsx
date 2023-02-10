import React, { Fragment } from 'react';
import { SearchResultPostnrProps } from '../../../../common/types/results';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { BodyShort } from '@navikt/ds-react';
import { PostnrKategori } from '../../../../common/types/data';
import { LocaleString } from '../../../localization/LocaleString';

import style from './SearchResultPostnr.module.css';

const HeaderText = (result: SearchResultPostnrProps) => {
    const {
        postnr,
        poststed,
        kommuneNavn,
        kategori,
        officeInfo,
        adresseQuery = '',
        withAllBydeler,
    } = result;

    const postnrOgPoststed = `${postnr} ${poststed}`;

    const numHits = officeInfo.length;

    if (numHits === 0) {
        return (
            <LocaleString
                id={'postnrResultNone'}
                args={[postnrOgPoststed, adresseQuery]}
            />
        );
    }

    if (numHits > 1) {
        if (kategori === PostnrKategori.Postbokser) {
            return (
                <LocaleString
                    id={'postnrResultPostbox'}
                    args={[postnr, kommuneNavn, numHits.toString()]}
                />
            );
        }

        if (kategori === PostnrKategori.Servicepostnummer) {
            return (
                <LocaleString
                    id={'postnrResultServiceBox'}
                    args={[postnr, kommuneNavn, numHits.toString()]}
                />
            );
        }

        if (withAllBydeler) {
            return (
                <LocaleString
                    id={'postnrResultBydeler'}
                    args={[postnr, kommuneNavn, numHits.toString()]}
                />
            );
        }

        return (
            <LocaleString
                id={'postnrResultMany'}
                args={[numHits.toString(), postnrOgPoststed, postnr]}
            />
        );
    }

    return <LocaleString id={'postnrResultOne'} args={[postnrOgPoststed]} />;
};

type Props = {
    result: SearchResultPostnrProps;
};

export const SearchResultPostnr = ({ result }: Props) => {
    const { officeInfo, adresseQuery } = result;

    if (!officeInfo) {
        return (
            <div>
                <LocaleString id={'errorInvalidResult'} />
            </div>
        );
    }

    return (
        <div>
            <div className={style.header}>
                <HeaderText {...result} />
            </div>
            {officeInfo.map((hit) => (
                <Fragment key={hit.enhetNr}>
                    {adresseQuery && (
                        <BodyShort
                            size={'small'}
                        >{`${hit.hitString}:`}</BodyShort>
                    )}
                    <OfficeLink officeInfo={hit} />
                </Fragment>
            ))}
        </div>
    );
};
