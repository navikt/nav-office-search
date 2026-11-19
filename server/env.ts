import { logger } from '@navikt/navno-logger';
import { z } from 'zod';

const schema = z.object({
	// Where the page is served from, for its og: tags
	APP_ORIGIN: z.url(),
	// nav-office-search-api, which does the searching, and the client id its tokens are for
	API_ORIGIN: z.url(),
	API_CLIENT_ID: z.string().min(1),
	// Texas, NAIS's token service. NAIS injects it for azure.application
	NAIS_TOKEN_ENDPOINT: z.url(),
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

const readEnv = () => {
	try {
		return parseEnv(process.env);
	} catch (e) {
		// It happens while the server's modules load, before main.ts can catch anything. Logged and exited here, since
		// Node would print a thrown error as plain text.
		logger.error('Server failed to start', e);
		process.exit(1);
	}
};

// Read when the server starts, so a misconfigured pod crashes before it takes traffic
export const env = readEnv();
