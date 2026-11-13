import type { ApiResponse } from '#server/api/apiResponse.ts';
import { getSnapshot } from '#server/data/snapshot.ts';

// Ready once the reference data has loaded, which nothing can be found without
export const isReadyHandler = (): ApiResponse<{ message: string }> =>
	getSnapshot()
		? { status: 200, body: { message: 'I am ready!' } }
		: { status: 503, body: { message: 'Loading reference data' } };
