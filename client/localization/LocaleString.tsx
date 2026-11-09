import React from 'react';
import { useLocale } from './useLocale.tsx';
import { localeString } from '#shared/localization/localeString.ts';
import type { LocaleStringId } from '#shared/localization/types.ts';

type Props = {
	id: LocaleStringId;
	args?: string[];
};

export const LocaleString = ({ id, args = [] }: Props) => {
	const locale = useLocale();
	return <>{localeString(id, locale, args)}</>;
};
