import { logger } from '@navikt/navno-logger';
import { Cron } from 'croner';
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
import { fetchBydeler } from './bydeler.ts';
import { buildKommuner } from './kommuner.ts';
import { fetchOfficePaths } from './officeUrls.ts';
import { fetchPostnrRegister } from './postnrRegister.ts';
import { buildPoststeder } from './poststeder.ts';
import { getSnapshot, setSnapshot, type Snapshot } from './snapshot.ts';

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

type Choice<Data> = {
	dataset: Dataset;
	/** The new data, or throws when its source can't give it */
	load: () => Promise<Data>;
	size: (data: Data) => number;
	/** The data in use, undefined before the first load */
	inUse: Data | undefined;
};

/**
 * Chooses between what a dataset's source has now and the data in use. The new data, unless the source fails, or the
 * new data is below the dataset's floor or too much smaller than the data in use; then the data in use. With none in
 * use yet, that throws, so the server doesn't start without it.
 */
const choose = async <Data>({ dataset, load, size, inUse }: Choice<Data>) => {
	const sizeInUse = inUse === undefined ? 0 : size(inUse);

	let data: Data;
	try {
		data = await load();
	} catch (e) {
		if (inUse === undefined) {
			throw new Error(`Failed to load ${sources[dataset]}`, { cause: e });
		}
		logger.error('Failed to load reference data - keeping current data', { dataset }, failureOf(e));
		return { data: inUse, replaced: false };
	}

	const sizes = { dataset, size: size(data), current: sizeInUse, floor: floors[dataset] };
	if (sizes.size < sizes.floor || sizes.size < sizeInUse * (1 - maxDrop)) {
		dataRejections.inc({ dataset });
		if (inUse === undefined) {
			throw Object.assign(new Error(`Too little reference data to start with: ${sources[dataset]}`), sizes);
		}
		logger.error('Refused new reference data - keeping current data', sizes);
		return { data: inUse, replaced: false };
	}

	logger.info('Loaded reference data', { dataset, size: sizes.size });
	return { data, replaced: true };
};

// One message for all of them, with the numbers as fields, so the log groups them
const logWithoutOffice = (dataset: 'kommuner' | 'poststeder' | 'bydeler', numbers: string[]) => {
	if (numbers.length > 0) {
		logger.warn('No office found', { dataset, count: numbers.length, numbers: numbers.slice(0, 20) });
	}
};

const recordReferenceData = ({ officePaths, bydeler, register, kommuner, poststeder }: Snapshot) => {
	const missingKommuner = kommunerWithoutOffice(register, kommuner.kommunerArray);
	const missingPoststeder = poststederWithoutOffice(poststeder.poststederArray, (kommunenr) =>
		Boolean(bydeler.bydelerByKommunenr[kommunenr]),
	);
	const missingBydeler = bydeler.bydelerWithoutOffice;

	referenceDataEntries.set({ dataset: 'postnr_register' }, register.length);
	referenceDataEntries.set({ dataset: 'kommuner' }, kommuner.kommunerArray.length);
	referenceDataEntries.set({ dataset: 'poststeder' }, poststeder.poststederArray.length);
	referenceDataEntries.set({ dataset: 'bydeler' }, bydeler.bydelerArray.length);
	referenceDataEntries.set({ dataset: 'office_urls' }, officePaths.size);

	referenceDataWithoutOffice.set({ dataset: 'kommuner' }, missingKommuner.length);
	referenceDataWithoutOffice.set({ dataset: 'poststeder' }, missingPoststeder.length);
	referenceDataWithoutOffice.set({ dataset: 'bydeler' }, missingBydeler.length);

	logWithoutOffice('kommuner', missingKommuner);
	logWithoutOffice('poststeder', missingPoststeder);
	logWithoutOffice('bydeler', missingBydeler);
};

/**
 * Loads the reference data into a new snapshot, one dataset at a time, each building on the ones chosen before it: the
 * office lookups need the office URLs, and the kommuner need the bydeler and the register. The poststeder are made from
 * the register and the kommuner, so there's nothing to check. The snapshot then replaces the one in use, all at once.
 */
const load = async () => {
	logger.info('Started loading data');
	const startedAt = performance.now();
	const inUse = getSnapshot();

	try {
		const officePaths = await choose({
			dataset: 'office_urls',
			load: fetchOfficePaths,
			size: (paths) => paths.size,
			inUse: inUse?.officePaths,
		});
		const bydeler = await choose({
			dataset: 'bydeler',
			load: () => fetchBydeler(officePaths.data),
			size: ({ bydelerArray }) => bydelerArray.length,
			inUse: inUse?.bydeler,
		});
		const register = await choose({
			dataset: 'postnr_register',
			load: fetchPostnrRegister,
			size: (rows) => rows.length,
			inUse: inUse?.register,
		});
		const kommuner = await choose({
			dataset: 'kommuner',
			load: () => buildKommuner(register.data, bydeler.data, officePaths.data),
			size: ({ kommunerArray }) => kommunerArray.length,
			inUse: inUse?.kommuner,
		});

		const snapshot: Snapshot = {
			officePaths: officePaths.data,
			bydeler: bydeler.data,
			register: register.data,
			kommuner: kommuner.data,
			poststeder: buildPoststeder(register.data, kommuner.data),
		};
		setSnapshot(snapshot);

		const complete = [officePaths, bydeler, register, kommuner].every(({ replaced }) => replaced);
		const durationSeconds = (performance.now() - startedAt) / 1000;
		dataLoads.inc({ outcome: complete ? 'success' : 'partial' });
		if (complete) {
			dataLoadDuration.set(durationSeconds);
			dataLastSuccess.setToCurrentTime();
		}
		recordReferenceData(snapshot);
		logger.info('Finished loading data', { durationSeconds: Number(durationSeconds.toFixed(1)), complete });
	} catch (e) {
		// Logged by whoever started the load
		dataLoads.inc({ outcome: 'failure' });
		throw e;
	}
};

let loading: Promise<void> | undefined;

/** Loads the reference data, or waits for the load already running and settles as it does */
export const loadData = () => {
	loading ??= load().finally(() => {
		loading = undefined;
	});
	return loading;
};

/**
 * Loads the reference data again every day at 06:00 UTC, whatever the machine's time zone. A refresh keeps whatever it
 * can't replace, so it shouldn't fail; should it anyway, it's logged, and the pod keeps serving. Stop the job on
 * shutdown.
 */
export const scheduleRefresh = () =>
	new Cron('0 0 6 * * *', { timezone: 'Etc/UTC', catch: (e) => logger.error('Refreshing data failed', e) }, loadData);
