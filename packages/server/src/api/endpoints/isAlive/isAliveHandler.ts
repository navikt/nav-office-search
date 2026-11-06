import type { ApiResponse } from '../../apiResponse';

export const isAliveHandler = (): ApiResponse<string> => ({ status: 200, body: 'I am alive!' });
