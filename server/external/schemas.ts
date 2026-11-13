import { z } from 'zod';

/*
 * What the server reads from each upstream's answers, checked as they arrive (transform: schema(…)). Loose: fields the
 * server doesn't read are allowed, and kept. test/upstream.test.ts parses every fixture and fake answer with these, so
 * the fixtures can't drift from what the code expects.
 */

/** XP: the offices' pages */
export const xpOfficeInfoSchema = z.looseObject({
	offices: z.array(z.looseObject({ enhetNr: z.string(), path: z.string() })),
});

/** SSB: the versions of its classification of bydeler (103). The current one has no validTo. */
export const ssbClassificationSchema = z.looseObject({
	versions: z.array(
		z.looseObject({
			validFrom: z.string(),
			validTo: z.string().nullish(),
			_links: z.looseObject({ self: z.looseObject({ href: z.string() }) }),
		}),
	),
});

/** SSB: one version of that classification */
export const ssbVersionSchema = z.looseObject({
	classificationItems: z.array(z.looseObject({ code: z.string(), name: z.string() })),
});

/** Azure AD's client credentials token */
export const tokenSchema = z.looseObject({
	access_token: z.string().min(1),
	expires_in: z.number(),
});

/** nav-office-search-api's /geoid: the office NORG has for a kommune or bydel */
export const officeSchema = z.looseObject({ enhetNr: z.string(), navn: z.string() });

/** nav-office-search-api's /adresse: PDL's addresses, passed on to the browser as they are */
export const adresseSokSchema = z.looseObject({
	totalHits: z.number(),
	adresser: z.array(
		z.looseObject({
			adressenavn: z.string(),
			// Lenient where the browser copes: it would rather show an odd address than none
			husnummer: z.number().nullable(),
			husbokstav: z.string().nullable(),
			postnummer: z.string(),
			poststed: z.string(),
			kommunenummer: z.string().nullable(),
			bydelsnummer: z.string().nullable(),
		}),
	),
});

/** nav-office-search-api's /bydel: the bydeler a postnummer has addresses in */
export const bydelSokSchema = z.looseObject({ bydeler: z.array(z.string()) });
