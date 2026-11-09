import { z } from 'zod';

const schema = z.object({
	// Where the page is served from, for its og: tags
	APP_ORIGIN: z.url(),
	// The nav.no frontend: the 404 page, and where the offices' pages are
	NAVNO_ORIGIN: z.url(),
	// XP, which knows the offices' paths
	XP_ORIGIN: z.url(),
	// nav-office-search-api, and the client id its tokens are for
	API_ORIGIN: z.url(),
	API_CLIENT_ID: z.string().min(1),
	// NAIS injects these for azure.application
	AZURE_APP_CLIENT_ID: z.string().min(1),
	AZURE_APP_CLIENT_SECRET: z.string().min(1),
	AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: z.url(),
	LOGIN_SESSION_API_URL: z.url(),
	PORT: z.coerce.number().int().positive().default(3005),
});

export const parseEnv = (source: Record<string, string | undefined>) => {
	const parsed = schema.safeParse(source);

	if (!parsed.success) {
		throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
	}

	return parsed.data;
};

// Read when the server starts, so a misconfigured pod crashes before it takes traffic
export const env = parseEnv(process.env);
