import { logger } from '@navikt/navno-logger';
import schedule from 'node-schedule';
import {
	dataLastSuccess,
	dataLoadDuration,
	dataLoads,
	dataRejections,
	referenceDataEntries,
	referenceDataWithoutOffice,
} from '#server/metrics/metrics.ts';
import { kommunerWithoutOffice, poststederWithoutOffice } from '#server/metrics/referenceData.ts';
import { failureOf } from '#server/utils/upstream.ts';
import { fetchBydeler, getBydelerArray, getBydelerForKommune, getBydelerWithoutOffice, setBydeler } from './bydeler.ts';
import { buildKommuner, getKommunerArray, setKommuner } from './kommuner.ts';
import { fetchOfficePaths, getOfficeUrlCount, setOfficePaths } from './officeUrls.ts';
import { fetchPostnrRegister, getPostnrRegister, setPostnrRegister } from './postnrRegister.ts';
import { buildPoststeder, getPoststedArray, setPoststeder } from './poststeder.ts';

type Dataset = 'office_urls' | 'bydeler' | 'postnr_register' | 'kommuner';

const sources: Record<Dataset, string> = {
	office_urls: 'office URLs from XP',
	bydeler: 'bydeler from SSB',
	postnr_register: 'the postnr register from bring',
	kommuner: 'offices for the kommuner',
};

// About half of what each held in November 2026 (425 office URLs, 37 bydeler with an office, 5136 postnumre, 357
// kommuner): far below anything real, and far above an empty or broken answer. To be tuned from the boot logs.
const floors: Record<Dataset, number> = { office_urls: 200, bydeler: 15, postnr_register: 2500, kommuner: 150 };

// Every dataset from the start, so a pod's first refusal shows in increase(), which can't see a series that appears at 1
for (const dataset of Object.keys(floors) as Dataset[]) {
	dataRejections.inc({ dataset }, 0);
}

// A refresh may lose up to this share of a dataset, as when kommuner merge, and no more. A bigger drop is more likely
// an upstream failing, like every office lookup failing when nav-office-search-api or its token is down.
const maxDrop = 0.1;

type Replacement<Data> = {
	dataset: Dataset;
	/** The new data, or throws when its source can't give it */
	load: () => Promise<Data>;
	size: (data: Data) => number;
	/** The size of the data in use, 0 before the first load */
	current: () => number;
	set: (data: Data) => void;
};

/**
 * Replaces a dataset with what its source has now, unless the source fails, or the new data is below the dataset's
 * floor or too much smaller than the data in use. Then the data in use is kept; with none in use yet, this throws, so
 * the server doesn't start without it. Says whether it replaced the data.
 */
const replace = async <Data>({ dataset, load, size, current, set }: Replacement<Data>) => {
	const inUse = current();

	let data: Data;
	try {
		data = await load();
	} catch (e) {
		if (inUse === 0) {
			throw new Error(`Failed to load ${sources[dataset]}`, { cause: e });
		}
		logger.error('Failed to load reference data - keeping current data', { dataset }, failureOf(e));
		return false;
	}

	const sizes = { dataset, size: size(data), current: inUse, floor: floors[dataset] };
	if (sizes.size < sizes.floor || sizes.size < inUse * (1 - maxDrop)) {
		dataRejections.inc({ dataset });
		if (inUse === 0) {
			throw Object.assign(new Error(`Too little reference data to start with: ${sources[dataset]}`), sizes);
		}
		logger.error('Refused new reference data - keeping current data', sizes);
		return false;
	}

	set(data);
	logger.info('Loaded reference data', { dataset, size: sizes.size });
	return true;
};

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

/**
 * Loads the reference data, one dataset at a time, each building on the ones before it as they are in use: the office
 * lookups need the office URLs, and the kommuner need the bydeler and the register. The poststeder are made from the
 * register and the kommuner, so there's nothing to check.
 */
export const loadData = async () => {
	if (isLoading) {
		return;
	}

	isLoading = true;
	logger.info('Started loading data');
	const startedAt = performance.now();

	try {
		const replaced = [
			await replace({
				dataset: 'office_urls',
				load: fetchOfficePaths,
				size: (paths) => paths.size,
				current: getOfficeUrlCount,
				set: setOfficePaths,
			}),
			await replace({
				dataset: 'bydeler',
				load: fetchBydeler,
				size: ({ bydelerArray }) => bydelerArray.length,
				current: () => getBydelerArray().length,
				set: setBydeler,
			}),
			await replace({
				dataset: 'postnr_register',
				load: fetchPostnrRegister,
				size: (rows) => rows.length,
				current: () => getPostnrRegister().length,
				set: setPostnrRegister,
			}),
			await replace({
				dataset: 'kommuner',
				load: () => buildKommuner(getPostnrRegister()),
				size: ({ kommunerArray }) => kommunerArray.length,
				current: () => getKommunerArray().length,
				set: setKommuner,
			}),
		];
		setPoststeder(buildPoststeder(getPostnrRegister()));

		const complete = replaced.every(Boolean);
		const durationSeconds = (performance.now() - startedAt) / 1000;
		dataLoads.inc({ outcome: complete ? 'success' : 'partial' });
		if (complete) {
			dataLoadDuration.set(durationSeconds);
			dataLastSuccess.setToCurrentTime();
		}
		recordReferenceData();
		logger.info('Finished loading data', { durationSeconds: Number(durationSeconds.toFixed(1)), complete });
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
