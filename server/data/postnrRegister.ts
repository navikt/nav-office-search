import { logger } from '@navikt/navno-logger';
import type { PostnrKategori } from '#shared/types/data.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import { getSnapshot } from './snapshot.ts';

const charEncodeFormat = 'windows-1252';

const bring = upstreamClient('bring', { timeout: DOWNLOAD_TIMEOUT_MS });

export type PostnrRegisterItem = {
	postnr: string;
	poststed: string;
	kommune: string;
	kommunenr: string;
	kategori: PostnrKategori;
};

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

/** The register as bring has it now: a tab separated text file in windows-1252. Throws when bring can't tell. */
export const fetchPostnrRegister = async () => {
	const buffer = await bring.get(serverUrls.postnrRegister, { responseType: 'arrayBuffer' });
	const { rows, malformed } = parsePostnrRegister(new TextDecoder(charEncodeFormat).decode(buffer));

	if (malformed > 0) {
		logger.warn('Left out lines of the postnr register that are not rows', { malformed });
	}

	return rows;
};

export const getPostnrRegister = () => getSnapshot()?.register ?? [];
