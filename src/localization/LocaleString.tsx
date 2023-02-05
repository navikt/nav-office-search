import React from 'react';
import { useLocale } from './useLocale';
import { localeString } from '../../src-common/localization/localeString';
import { LocaleStringId } from '../../src-common/localization/types';

type Props = {
    id: LocaleStringId;
    args?: string[];
};

export const LocaleString = ({ id, args = [] }: Props) => {
    const locale = useLocale();

    return <>{localeString(id, locale, args)}</>;
};
