import React from 'react';
import { SearchResultPostnrProps } from '../../../../../common/types/results';
import { OfficeLink } from '../../OfficeLink/OfficeLink';
import { BodyLong } from '@navikt/ds-react';
import { PostnrKategori } from '../../../../../common/types/data';
import { LocaleString } from '../../../localization/LocaleString';

import style from './SearchResultPostnr.module.css';

const HeaderText = (result: SearchResultPostnrProps) => {
    const { postnr, poststed, kommuneNavn, kategori, officeInfo, withAllBydeler } = result;

    const postnrOgPoststed = `${postnr} ${poststed}`;

    const numHits = officeInfo.length;

    if (numHits === 0) {
        return <LocaleString id={'postnrResultNone'} args={[postnrOgPoststed]} />;
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
            <LocaleString id={'postnrResultMany'} args={[numHits.toString(), postnrOgPoststed]} />
        );
    }

    return <LocaleString id={'postnrResultOne'} args={[postnrOgPoststed]} />;
};

type Props = {
    result: SearchResultPostnrProps;
    resultInput?: string | null;
};

export const SearchResultPostnr = ({ result, resultInput }: Props) => {
    const { officeInfo } = result;

    if (!officeInfo) {
        return (
            <div>
                <LocaleString id={'errorInvalidResult'} />
            </div>
        );
    }

    return (
        <div>
            <BodyLong className={style.header}>
                {resultInput ? (
                    <LocaleString
                        id={officeInfo.length === 0 ? 'nameResultNone' : 'nameResultFound'}
                        args={[resultInput, officeInfo.length.toString()]}
                    />
                ) : (
                    <HeaderText {...result} />
                )}
            </BodyLong>
            {officeInfo.map((hit) => (
                <OfficeLink key={hit.enhetNr} officeInfo={hit} />
            ))}
        </div>
    );
};
