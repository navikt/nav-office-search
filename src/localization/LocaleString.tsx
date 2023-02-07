import React from 'react';
import { useLocale } from './useLocale';
import { localeString } from '../../common/localization/localeString';
import { LocaleStringId } from '../../common/localization/types';

type Props = {
    id: LocaleStringId;
    args?: string[];
};

export const LocaleString = ({ id, args = [] }: Props) => {
    const locale = useLocale();
    return <>{localeString(id, locale, args)}</>;
};
