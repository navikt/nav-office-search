import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllEnvs();
});

// The server's URLs with these origins in its environment
const urlsWith = async (origins: Record<string, string>) => {
	for (const [name, origin] of Object.entries(origins)) {
		vi.stubEnv(name, origin);
	}
	vi.resetModules();
	return (await import('./urls.ts')).serverUrls;
};

test.each([
	['without a slash at the end', ''],
	['with one', '/'],
])('joins an origin %s and its path with one slash', async (_, slash) => {
	const urls = await urlsWith({
		API_ORIGIN: `https://api.test${slash}`,
		XP_ORIGIN: `https://xp.test${slash}`,
		NAVNO_ORIGIN: `https://www.nav.test${slash}`,
	});

	expect(urls).toMatchObject({
		adresseApi: 'https://api.test/adresse',
		bydelApi: 'https://api.test/bydel',
		officesApi: 'https://api.test/geoids',
		xpOfficeInfoApi: 'https://xp.test/_/service/no.nav.navno/officeInfo',
		notFoundPage: 'https://www.nav.test/404',
	});
});
