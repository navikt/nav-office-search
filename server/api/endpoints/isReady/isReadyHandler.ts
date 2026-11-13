import type { ApiResponse } from '#server/api/apiResponse.ts';

// The server listens only once the reference data has loaded, so it's ready whenever it answers
export const isReadyHandler = (): ApiResponse<{ message: string }> => ({
	status: 200,
	body: { message: 'I am ready!' },
});
