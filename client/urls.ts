import { BASE_PATH } from '#shared/basePath.ts';
import type { AppLocale } from '#shared/localization/types.ts';

const API = `${BASE_PATH}/api`;

export const clientUrls = {
	appPath: {
		nb: BASE_PATH,
		nn: `${BASE_PATH}/nn`,
		en: `${BASE_PATH}/en`,
	},
	searchApi: `${API}/search`,
	searchNameApi: `${API}/search/name`,
	searchAddressApi: `${API}/search/address`,
	geoidApi: `${API}/geoid`,
	loginStatusApi: `${API}/loginstatus`,
	// Same host as the app: www.nav.no in prod, www.ansatt.dev.nav.no in dev
	dittNavKontor: (locale: AppLocale) => `/person/personopplysninger/${locale}/#ditt-nav-kontor`,
};
