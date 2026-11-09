import { createUpstreamFakes, routeTo } from '#test/upstream/fakes.ts';

export { DECORATOR, json, NOT_FOUND_HTML } from '#test/upstream/fakes.ts';

// The fakes (test/upstream/fakes.ts) on the origins harness.ts configures the server with. Anything else gets undefined,
// and the stub answers it with a 599.
export const ORIGINS = {
	// APP_ORIGIN, NAVNO_ORIGIN and XP_ORIGIN, as in prod
	navno: 'https://www.nav.no',
	api: 'https://nav-office-search-api.prod-fss-pub.nais.io',
	tokenEndpoint: 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token',
	loginSession: 'https://login.nav.no/oauth2/session',
	// Where nav-dekoratoren-moduler fetches the decorator: outside NAIS, and the service inside it
	decorator: 'https://www.nav.no/dekoratoren',
	decoratorService: 'http://nav-dekoratoren.personbruker',
};

/** What the server sends nav-office-search-api: the fakes' access token, base64-encoded. The backend never checks it. */
export const AUTHORIZATION = 'Bearer YXp1cmUtdG9rZW4=';

const { routes, answer } = createUpstreamFakes({
	...ORIGINS,
	xp: ORIGINS.navno,
	decorators: [ORIGINS.decorator, ORIGINS.decoratorService],
});

export const fakeUpstream = answer;

/** What the server calls, for on() overrides and assertions */
export const ROUTES = {
	...routes,
	// The decorator outside NAIS; in NAIS, the same paths on ORIGINS.decoratorService
	decoratorSsr: routeTo('GET', `${ORIGINS.decorator}/ssr`),
	decoratorVersion: routeTo('GET', `${ORIGINS.decorator}/api/version`),
};
