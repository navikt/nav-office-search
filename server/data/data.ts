import { logger } from '@navikt/navno-logger';
import { Cron } from 'croner';
import {
	dataLastSuccess,
	dataLoadDuration,
	dataLoads,
	referenceDataEntries,
	referenceDataWithoutOffice,
} from '#server/metrics/metrics.ts';
import { bydelerWithoutOffice, kommunerWithoutOffice, poststederWithoutOffice } from '#server/metrics/referenceData.ts';
import type { Bydel, Kommune, Poststed } from '#shared/types/data.ts';
import { buildBydeler, fetchSsbBydeler } from './bydeler.ts';
import { buildKommuner } from './kommuner.ts';
import { fetchNorgOffices, fetchOfficePaths, joinOffices, type Offices } from './offices.ts';
import { fetchPostnrRegister } from './postnrRegister.ts';
import { buildPoststeder } from './poststeder.ts';

/** The reference data the searches read: all of it from one load, and never changed after */
export type ReferenceData = {
	/** Each kommune's and bydel's office, by kommunenr or bydelsnr */
	offices: Offices;
	/** The bydeler with an office */
	bydeler: Bydel[];
	/** The kommuner with bydeler, or with an office */
	kommuner: Kommune[];
	/** Every poststed, by postnummer */
	poststeder: Map<string, Poststed>;
};

// This guards against data coming back empty or significantly changed from 'today'
// Each is set to roughly half of the November 2026 data levels
const floors = { offices: 200, bydeler: 15, poststeder: 2500, kommuner: 150 };

let inUse: ReferenceData | undefined;

/** The data in use. Throws before the first load, which the server waits for before it listens. */
export const referenceData = () => {
	if (!inUse) {
		throw new Error('The reference data is not loaded');
	}
	return inUse;
};

// Says which source failed
const from = async <Data>(source: string, loading: Promise<Data>) => {
	try {
		return await loading;
	} catch (e) {
		throw new Error(`Failed to load ${source}`, { cause: e });
	}
};

// The sizes and the areas without an office, as gauges and in the log
const record = (sizes: Record<string, number>, withoutOffice: Record<string, string[]>) => {
	for (const [dataset, size] of Object.entries(sizes)) {
		referenceDataEntries.set({ dataset }, size);
	}

	for (const [dataset, numbers] of Object.entries(withoutOffice)) {
		referenceDataWithoutOffice.set({ dataset }, numbers.length);
		// One message for all of them, with the numbers as fields, so the log groups them
		if (numbers.length > 0) {
			logger.warn('No office found', { dataset, count: numbers.length, numbers: numbers.slice(0, 20) });
		}
	}
};

/**
 * Loads the reference data and puts it in use: all of it, or none. When a source fails, or the new data is too small
 * to be right, this throws and the data in use stays as it is. At startup that stops the server; the daily refresh
 * logs it and tries again the next day.
 */
export const loadData = async () => {
	logger.info('Started loading data');
	const startedAt = performance.now();

	try {
		const [officePaths, norgOffices, ssbBydeler, register] = await Promise.all([
			from('office URLs from XP', fetchOfficePaths()),
			from('offices from nav-office-search-api', fetchNorgOffices()),
			from('bydeler from SSB', fetchSsbBydeler()),
			from('the postnr register from bring', fetchPostnrRegister()),
		]);

		// Each builds on the ones before it
		const offices = joinOffices(norgOffices, officePaths);
		const bydeler = buildBydeler(ssbBydeler, offices);
		const kommuner = buildKommuner(register, bydeler, offices);
		const poststeder = buildPoststeder(register, kommuner);

		const sizes: Record<string, number> = {
			office_urls: officePaths.size,
			offices: offices.size,
			bydeler: bydeler.length,
			postnr_register: register.length,
			kommuner: kommuner.length,
			poststeder: poststeder.size,
		};
		for (const [dataset, floor] of Object.entries(floors)) {
			const size = sizes[dataset];
			if (size < floor) {
				throw Object.assign(new Error(`Too little reference data: ${dataset}`), { dataset, size, floor });
			}
		}

		inUse = { offices, bydeler, kommuner, poststeder };

		record(sizes, {
			kommuner: kommunerWithoutOffice(register, kommuner),
			poststeder: poststederWithoutOffice(poststeder.values(), kommuner),
			bydeler: bydelerWithoutOffice(ssbBydeler, offices),
		});
		const durationSeconds = (performance.now() - startedAt) / 1000;
		dataLoads.inc({ outcome: 'success' });
		dataLoadDuration.set(durationSeconds);
		dataLastSuccess.setToCurrentTime();
		logger.info('Finished loading data', { durationSeconds: Number(durationSeconds.toFixed(1)), ...sizes });
	} catch (e) {
		// Logged by whoever started the load
		dataLoads.inc({ outcome: 'failure' });
		throw e;
	}
};

/**
 * Loads the reference data again every day at 06:00 UTC, whatever the machine's time zone: an hour after
 * nav-office-search-api has loaded NORG's offices again. A refresh that fails is logged, and the pod keeps serving the
 * data it has. Stop the job on shutdown.
 */
export const scheduleRefresh = () =>
	new Cron('0 0 6 * * *', { timezone: 'Etc/UTC', catch: (e) => logger.error('Refreshing data failed', e) }, loadData);
