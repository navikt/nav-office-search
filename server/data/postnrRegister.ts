import { logger } from '@navikt/navno-logger';
import type { PostnrKategori } from '#shared/types/data.ts';
import { serverUrls } from '#server/urls.ts';
import { observeUpstream } from '#server/metrics/metrics.ts';

const charEncodeFormat = 'windows-1252';

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

// This fetches a raw tab separated txt file from posten.no
const fetchPostnummerTxtFromPosten = async (): Promise<string | null> => {
	logger.info('Fetching postnr register', { url: serverUrls.postnrRegister });
	try {
		return await observeUpstream('bring', () => fetch(serverUrls.postnrRegister))
			.then((res) => {
				if (res.ok) {
					return res.arrayBuffer();
				}

				throw new Error(`Error fetching postnr register: ${res.status} - ${res.statusText}`);
			})
			.then((buffer) => new TextDecoder(charEncodeFormat).decode(buffer));
	} catch (e) {
		logger.error('Fetching postnr register failed', e);
		return null;
	}
};

export const loadPostnrRegister = async () => {
	const postnrRegisterDataRaw = await fetchPostnummerTxtFromPosten();

	if (postnrRegisterDataRaw) {
		logger.info('Refreshed postnr register');
		postnrRegisterData = transformPostnrRegisterData(postnrRegisterDataRaw);
	} else if (postnrRegisterData.length > 0) {
		logger.error('Failed to fetch from postnr-register, keeping currently cached data');
	} else {
		const msg = 'Failed to fetch from postnr-register and no previously cached data exists!';
		logger.error(msg);

		throw new Error(msg);
	}
};

export const getPostnrRegister = () => {
	return postnrRegisterData;
};
