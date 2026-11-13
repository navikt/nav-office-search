import { schema } from '@itsy/corgi/schema';
import { ssbClassificationSchema, ssbVersionSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import type { Bydel } from '#shared/types/data.ts';
import type { Offices } from './offices.ts';

const ssb = upstreamClient('ssb', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });

/** A bydel as SSB lists it: its bydelsnr and its name */
export type SsbBydel = { code: string; name: string };

// What SSB calls a kommune's addresses that are in none of its bydeler
const NO_BYDEL = 'Uoppgitt';

/** The bydeler in the version of SSB's classification that is valid today. Throws when SSB can't tell. */
export const fetchSsbBydeler = async (): Promise<SsbBydel[]> => {
	const { versions } = await ssb.get(serverUrls.ssbBydelerClassification, {
		transform: schema(ssbClassificationSchema),
	});

	const now = new Date();
	const current = versions.find(
		({ validFrom, validTo }) => now >= new Date(validFrom) && (!validTo || now <= new Date(validTo)),
	);
	if (!current) {
		throw new Error('SSB has no version of its classification of bydeler that is valid today');
	}

	const { classificationItems } = await ssb.get(current._links.self.href, { transform: schema(ssbVersionSchema) });
	return classificationItems.filter(({ name }) => name !== NO_BYDEL);
};

/** SSB's bydeler with their offices. A bydel without an office is left out. */
export const buildBydeler = (ssbBydeler: SsbBydel[], offices: Offices): Bydel[] =>
	ssbBydeler.flatMap(({ code: bydelsnr, name }) => {
		const officeInfo = offices.get(bydelsnr);
		return officeInfo ? [{ bydelsnr, navn: name, navnNormalized: normalizeString(name), officeInfo }] : [];
	});
