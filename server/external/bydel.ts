import { schema } from '@itsy/corgi/schema';
import { serverUrls } from '#server/urls.ts';
import { officeSearchApi } from './officeSearchApi.ts';
import { bydelSokSchema } from './schemas.ts';

const bydelApi = officeSearchApi('bydel');

/** The bydeler PDL has addresses in for a postnummer, through nav-office-search-api. Throws when it can't answer. */
export const fetchPdlBydelsok = (postnummer: string) =>
	bydelApi.get(serverUrls.bydelApi, { query: { postnummer }, transform: schema(bydelSokSchema) });
