import type { ApiResponse } from '#server/api/apiResponse.ts';

export const isAliveHandler = (): ApiResponse<string> => ({ status: 200, body: 'I am alive!' });
