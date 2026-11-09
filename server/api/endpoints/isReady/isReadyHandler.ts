import type { ApiResponse } from '#server/api/apiResponse.ts';

export const isReadyHandler = (): ApiResponse<{ message: string }> => ({
	status: 200,
	body: { message: 'I am ready!' },
});
