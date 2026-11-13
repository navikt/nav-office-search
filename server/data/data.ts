import { logger } from '@navikt/navno-logger';
import { getBydelerArray, getBydelerForKommune, getBydelerWithoutOffice, loadBydelerData } from './bydeler.ts';
import { getPostnrRegister, loadPostnrRegister } from './postnrRegister.ts';
import { getOfficeUrlCount, loadOfficeUrlsFromXP } from './officeUrls.ts';
import { buildKommuneDictionary, getKommunerArray } from './kommuner.ts';
import { getPoststedArray, loadPoststederData } from './poststeder.ts';
import schedule from 'node-schedule';
import {
	dataLastSuccess,
	dataLoadDuration,
	dataLoads,
	referenceDataEntries,
	referenceDataWithoutOffice,
} from '#server/metrics/metrics.ts';
import { kommunerWithoutOffice, poststederWithoutOffice } from '#server/metrics/referenceData.ts';

let isLoading = false;

// One message for all of them, with the numbers as fields, so the log groups them
const logWithoutOffice = (dataset: 'kommuner' | 'poststeder' | 'bydeler', numbers: string[]) => {
	if (numbers.length > 0) {
		logger.warn('No office found', { dataset, count: numbers.length, numbers: numbers.slice(0, 20) });
	}
};

const recordReferenceData = () => {
	const register = getPostnrRegister();
	const missingKommuner = kommunerWithoutOffice(register, getKommunerArray());
	const missingPoststeder = poststederWithoutOffice(getPoststedArray(), (kommunenr) =>
		Boolean(getBydelerForKommune(kommunenr)),
	);
	const missingBydeler = getBydelerWithoutOffice();

	referenceDataEntries.set({ dataset: 'postnr_register' }, register.length);
	referenceDataEntries.set({ dataset: 'kommuner' }, getKommunerArray().length);
	referenceDataEntries.set({ dataset: 'poststeder' }, getPoststedArray().length);
	referenceDataEntries.set({ dataset: 'bydeler' }, getBydelerArray().length);
	referenceDataEntries.set({ dataset: 'office_urls' }, getOfficeUrlCount());

	referenceDataWithoutOffice.set({ dataset: 'kommuner' }, missingKommuner.length);
	referenceDataWithoutOffice.set({ dataset: 'poststeder' }, missingPoststeder.length);
	referenceDataWithoutOffice.set({ dataset: 'bydeler' }, missingBydeler.length);

	logWithoutOffice('kommuner', missingKommuner);
	logWithoutOffice('poststeder', missingPoststeder);
	logWithoutOffice('bydeler', missingBydeler);
};

export const loadData = async () => {
	if (isLoading) {
		return;
	}

	isLoading = true;
	logger.info('Started loading data');
	const startedAt = performance.now();

	try {
		await loadOfficeUrlsFromXP();
		await loadBydelerData();
		await loadPostnrRegister();

		const postnrRegister = getPostnrRegister();
		await buildKommuneDictionary(postnrRegister);
		await loadPoststederData(postnrRegister);

		const durationSeconds = (performance.now() - startedAt) / 1000;
		dataLoads.inc({ outcome: 'success' });
		dataLoadDuration.set(durationSeconds);
		dataLastSuccess.setToCurrentTime();
		recordReferenceData();
		logger.info('Finished loading data', { durationSeconds: Number(durationSeconds.toFixed(1)) });
	} catch (e) {
		// Logged by whoever started the load
		dataLoads.inc({ outcome: 'failure' });
		throw e;
	} finally {
		isLoading = false;
	}
};

export const loadDataAndStartSchedule = async () => {
	await loadData();

	// A refresh keeps whatever it can't replace, so it shouldn't fail. Should it anyway, the pod keeps serving.
	schedule.scheduleJob({ hour: 6, minute: 0, second: 0 }, async () => {
		try {
			await loadData();
		} catch (e) {
			logger.error('Refreshing data failed', e);
		}
	});
};
