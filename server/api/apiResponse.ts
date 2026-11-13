import type { LocaleStringId } from '#shared/localization/types.ts';
import type { SearchResultErrorProps } from '#shared/types/results.ts';

/** What a handler answers with. Serving it, whatever the web framework, is up to the routes. */
export type ApiResponse<Body = unknown> = { status: number; body: Body };

/** The body of an error answer: the message the browser shows */
export const apiErrorResponse = (messageId: LocaleStringId): SearchResultErrorProps => ({
	type: 'error',
	messageId,
});
