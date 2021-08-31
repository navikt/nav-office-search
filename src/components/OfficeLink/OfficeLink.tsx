import React from 'react';
import { Link } from '@navikt/ds-react';

type Props = {
    name: string;
    href: string;
};

export const OfficeLink = ({ name, href }: Props) => {
    return <Link href={href}>{name}</Link>;
};
