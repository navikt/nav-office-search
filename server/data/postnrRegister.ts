import { logger } from '@navikt/navno-logger';
import type { PostnrKategori } from '#shared/types/data.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, failureOf, upstreamClient } from '#server/utils/upstream.ts';

const charEncodeFormat = 'windows-1252';

const bring = upstreamClient('bring', { timeout: DOWNLOAD_TIMEOUT_MS });

type PostnrRegisterItemRaw = [
	postnr: string,
	poststed: string,
	kommunenr: string,
	kommune: string,
	kategori: PostnrKategori,
];

export type PostnrRegisterItem = {
	postnr: string;
	poststed: string;
	kommune: string;
	kommunenr: string;
	kategori: PostnrKategori;
};

let postnrRegisterData: PostnrRegisterItem[] = [];

export const transformPostnrRegisterData = (rawText: string): PostnrRegisterItem[] => {
	const allRows = rawText.split('\n');

	return allRows.map((stringRow) => {
		const item = stringRow.trim().split('\t') as PostnrRegisterItemRaw;
		const [postnr, poststed, kommunenr, kommune, kategori] = item;

		return {
			postnr,
			poststed,
			kommunenr,
			kommune,
			kategori,
		};
	});
};

// A tab separated text file from bring.no, in windows-1252
const fetchPostnummerTxtFromPosten = async () => {
	logger.info('Fetching postnr register', { url: serverUrls.postnrRegister });
	const buffer = await bring.get(serverUrls.postnrRegister, { responseType: 'arrayBuffer' });
	return new TextDecoder(charEncodeFormat).decode(buffer);
};

export const loadPostnrRegister = async () => {
	let postnrRegisterDataRaw: string;
	try {
		postnrRegisterDataRaw = await fetchPostnummerTxtFromPosten();
	} catch (e) {
		if (postnrRegisterData.length === 0) {
			throw new Error('Failed to fetch from postnr-register and no previously cached data exists!', { cause: e });
		}

		logger.error('Failed to fetch from postnr-register - keeping current data', failureOf(e));
		return;
	}

	logger.info('Refreshed postnr register');
	postnrRegisterData = transformPostnrRegisterData(postnrRegisterDataRaw);
};

export const getPostnrRegister = () => {
	return postnrRegisterData;
};
