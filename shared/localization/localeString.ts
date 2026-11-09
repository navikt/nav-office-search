import { localeModuleNb } from './modules/nb-default.tsx';
import { localeModuleNn } from './modules/nn.tsx';
import { localeModuleEn } from './modules/en.tsx';
import type { AppLocale, LocaleModule, LocaleStringId } from './types.ts';

const localeModules: { [key in AppLocale]: LocaleModule } = {
	nb: localeModuleNb,
	nn: localeModuleNn,
	en: localeModuleEn,
};

export const localeString = (id: LocaleStringId, locale: AppLocale, args: string[] = []) => {
	const value = localeModules[locale][id];
	return typeof value === 'function' ? value(...(args as [string, string, string])) : value;
};
