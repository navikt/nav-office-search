import { logger } from '@navikt/navno-logger';
import type { PostnrKategori } from '#shared/types/data.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, failureOf, upstreamClient } from '#server/utils/upstream.ts';

const charEncodeFormat = 'windows-1252';

const bring = upstreamClient('bring', { timeout: DOWNLOAD_TIMEOUT_MS });

export type PostnrRegisterItem = {
	postnr: string;
	poststed: string;
	kommune: string;
	kommunenr: string;
	kategori: PostnrKategori;
};

let postnrRegisterData: PostnrRegisterItem[] = [];

const isFourDigits = (value: string) => /^\d{4}$/.test(value);

/**
 * The register's rows: postnr, poststed, kommunenr, kommune and kategori, tab separated. Blank lines, like the one the
 * file ends with, are skipped. A line that isn't a complete row is left out and counted. A kategori it doesn't know,
 * or a column it doesn't read, doesn't make a row incomplete.
 */
export const parsePostnrRegister = (text: string) => {
	const rows: PostnrRegisterItem[] = [];
	let malformed = 0;

	for (const line of text.split('\n')) {
		if (!line.trim()) {
			continue;
		}

		const [postnr = '', poststed = '', kommunenr = '', kommune = '', kategori = ''] = line.trim().split('\t');
		if (isFourDigits(postnr) && poststed && isFourDigits(kommunenr) && kommune && kategori) {
			rows.push({ postnr, poststed, kommunenr, kommune, kategori: kategori as PostnrKategori });
		} else {
			malformed++;
		}
	}

	return { rows, malformed };
};

// A tab separated text file from bring.no, in windows-1252
const fetchPostnrRegister = async () => {
	logger.info('Fetching postnr register', { url: serverUrls.postnrRegister });
	const buffer = await bring.get(serverUrls.postnrRegister, { responseType: 'arrayBuffer' });
	const { rows, malformed } = parsePostnrRegister(new TextDecoder(charEncodeFormat).decode(buffer));

	if (malformed > 0) {
		logger.warn('Left out lines of the postnr register that are not rows', { malformed });
	}
	// Bring answering with something non-data, like an error page
	if (rows.length === 0) {
		throw new Error('The postnr register has no rows');
	}

	return rows;
};

export const loadPostnrRegister = async () => {
	let rows: PostnrRegisterItem[];
	try {
		rows = await fetchPostnrRegister();
	} catch (e) {
		if (postnrRegisterData.length === 0) {
			throw new Error('Failed to fetch from postnr-register and no previously cached data exists!', { cause: e });
		}

		logger.error('Failed to fetch from postnr-register - keeping current data', failureOf(e));
		return;
	}

	logger.info('Refreshed postnr register', { rows: rows.length });
	postnrRegisterData = rows;
};

export const getPostnrRegister = () => {
	return postnrRegisterData;
};
