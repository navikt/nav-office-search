import React from 'react';
import { LinkCard } from '@navikt/ds-react';
import { OfficeInfo } from '../../../../common/types/data';
import style from './OfficeLink.module.css';

type Props = {
    officeInfo: OfficeInfo;
};

export const OfficeLink = ({ officeInfo }: Props) => {
    const { url, name } = officeInfo;

    return (
        <LinkCard data-color="accent" className={style.card}>
            <LinkCard.Title as={'span'}>
                <LinkCard.Anchor href={url}>{name}</LinkCard.Anchor>
            </LinkCard.Title>
        </LinkCard>
    );
};
