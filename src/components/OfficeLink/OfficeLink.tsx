import React from 'react';
import { BodyShort, Link } from '@navikt/ds-react';
import { Chevron } from '../Chevron/Chevron';
import style from './OfficeLink.module.css';
import { OfficeInfo } from '../../types/searchResult';

type Props = {
    officeInfo: OfficeInfo;
};

export const OfficeLink = ({ officeInfo }: Props) => {
    const { url, kontorNavn } = officeInfo;

    return (
        <Link href={url} className={style.link}>
            <Chevron className={style.chevron} />
            <BodyShort>{kontorNavn}</BodyShort>
        </Link>
    );
};
