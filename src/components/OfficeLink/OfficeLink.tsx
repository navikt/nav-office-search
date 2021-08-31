import React from 'react';
import { BodyShort, Link } from '@navikt/ds-react';
import { Chevron } from '../Chevron/Chevron';
import style from './OfficeLinks.module.css';

type Props = {
    name: string;
    href: string;
};

export const OfficeLink = ({ name, href }: Props) => {
    return (
        <Link href={href} className={style.link}>
            <Chevron className={style.chevron} />
            <BodyShort>{name}</BodyShort>
        </Link>
    );
};
