import type { ApiResponse } from '../../apiResponse';

export const isReadyHandler = (): ApiResponse<{ message: string }> => ({
	status: 200,
	body: { message: 'I am ready!' },
});
