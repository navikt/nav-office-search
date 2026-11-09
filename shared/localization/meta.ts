import type { AppLocale } from './types.ts';

/** The strings the server needs for a page's meta tags, apart from the locale modules so it doesn't load their JSX */
export const pageMeta: Record<AppLocale, { documentTitle: string; ingressLine1: string }> = {
	nb: {
		documentTitle: 'Finn Nav-kontor - nav.no',
		ingressLine1: 'Finn ut hvilket kontor du tilhører, eller søk i listen over alle Nav-kontor.',
	},
	nn: {
		documentTitle: 'Finn Nav-kontor - nav.no',
		ingressLine1: 'Finn ut kva kontor du tilhøyrer, eller søk i lista over alle Nav-kontor.',
	},
	en: {
		documentTitle: 'Find Nav office - nav.no',
		ingressLine1: 'Find out which office you belong to, or search the list of all Nav offices.',
	},
};
