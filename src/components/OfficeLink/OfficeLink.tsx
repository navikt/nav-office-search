import React from 'react';
import { BodyShort, Link } from '@navikt/ds-react';
import { Chevron } from '../Chevron/Chevron';
import { OfficeInfo } from '../../types/data';
import style from './OfficeLink.module.css';

type Props = {
    officeInfo: OfficeInfo;
};

export const OfficeLink = ({ officeInfo }: Props) => {
    const { url, name } = officeInfo;

    return (
        <Link href={url} className={style.link}>
            <Chevron className={style.chevron} />
            <BodyShort>{name}</BodyShort>
        </Link>
    );
};
