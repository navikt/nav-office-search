import { schema } from '@itsy/corgi/schema';
import { serverUrls } from '#server/urls.ts';
import { officeSearchApi } from './officeSearchApi.ts';
import { adresseSokSchema } from './schemas.ts';

const adresseApi = officeSearchApi('adresse');

/** PDL's addresses matching what someone typed, through nav-office-search-api. Throws when it can't answer. */
export const fetchPdlAdresseSok = (adresse: string) =>
	adresseApi.get(serverUrls.adresseApi, { query: { queryString: adresse }, transform: schema(adresseSokSchema) });
