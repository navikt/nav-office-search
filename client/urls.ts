import { joinURL } from 'ufo';
import { BASE_PATH } from '#shared/basePath.ts';
import type { AppLocale } from '#shared/localization/types.ts';

const api = (path: string) => joinURL(BASE_PATH, 'api', path);

export const clientUrls = {
	appPath: {
		nb: BASE_PATH,
		nn: joinURL(BASE_PATH, 'nn'),
		en: joinURL(BASE_PATH, 'en'),
	},
	searchApi: api('search'),
	searchNameApi: api('search/name'),
	searchAddressApi: api('search/address'),
	geoidApi: api('geoid'),
	loginStatusApi: api('loginstatus'),
	// Same host as the app: www.nav.no in prod, www.ansatt.dev.nav.no in dev
	dittNavKontor: (locale: AppLocale) => `/person/personopplysninger/${locale}/#ditt-nav-kontor`,
};
