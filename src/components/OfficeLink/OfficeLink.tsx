import React from 'react';
import { BodyShort, Link } from '@navikt/ds-react';
import { OfficeInfo } from '../../../common/types/data';
import { OfficeLinkChevron } from './OfficeLinkChevron';
import style from './OfficeLink.module.css';

type Props = {
    officeInfo: OfficeInfo;
};

export const OfficeLink = ({ officeInfo }: Props) => {
    const { url, name } = officeInfo;

    return (
        <Link href={url} className={style.link}>
            <OfficeLinkChevron className={style.chevron} aria-hidden={true} />
            <BodyShort>{name}</BodyShort>
        </Link>
    );
};
