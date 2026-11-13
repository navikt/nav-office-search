import type { BydelerData } from './bydeler.ts';
import type { KommunerData } from './kommuner.ts';
import type { OfficePaths } from './officeUrls.ts';
import type { PostnrRegisterItem } from './postnrRegister.ts';
import type { PoststederData } from './poststeder.ts';

/**
 * All the reference data, replaced as one by loadData, and never changed after: a search sees one load's data, never
 * parts of two. Each part is the new data or, when that was refused, the part the snapshot before had.
 */
export type Snapshot = {
	officePaths: OfficePaths;
	bydeler: BydelerData;
	register: PostnrRegisterItem[];
	kommuner: KommunerData;
	poststeder: PoststederData;
};

let current: Snapshot | undefined;

/** The data in use, or undefined before the first load */
export const getSnapshot = () => current;

export const setSnapshot = (snapshot: Snapshot) => {
	current = snapshot;
};
