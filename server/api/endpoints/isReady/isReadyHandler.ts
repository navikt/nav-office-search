import type { ApiResponse } from '#server/api/apiResponse.ts';

// The server has nothing to load before it can answer, so it's ready whenever it does
export const isReadyHandler = (): ApiResponse<{ message: string }> => ({
	status: 200,
	body: { message: 'I am ready!' },
});
