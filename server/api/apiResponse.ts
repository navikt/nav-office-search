/** What a handler answers with. Serving it, whatever the web framework, is up to the routes. */
export type ApiResponse<Body = unknown> = { status: number; body: Body };
