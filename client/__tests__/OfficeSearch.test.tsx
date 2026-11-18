import { act, cleanup, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { PostnrKategori } from '#shared/types/data.ts';
import type { AppLocale } from '#shared/localization/types.ts';
import type { SearchResultProps } from '#shared/types/results.ts';
import { OfficeSearch } from '#client/components/OfficeSearch.tsx';
import { formatAddressLabel } from '#client/components/SearchResult/SearchResultAdresse/addressSuggestions.ts';
import { SEARCH_DEBOUNCE_MS, SPINNER_DELAY_MS } from '#client/components/SearchForm/SearchForm.tsx';
import { LocaleProvider } from '#client/localization/useLocale.tsx';
import {
	addressResult,
	adresse,
	errorResult,
	nameHit,
	nameResult,
	offices,
	osloPostnrResult,
	postnrResult,
	storgataAdresser,
} from './support/fixtures.ts';
import { apiRequests, mockApi, type Reply, wasAborted } from './support/api.ts';
import { renderAndSettle } from './support/render.tsx';

// APM itself stays out of the tests
const apm = vi.hoisted(() => ({ loadApm: vi.fn(), captureException: vi.fn() }));
vi.mock('#client/utils/apm.ts', () => apm);

let user: UserEvent;

beforeEach(() => {
	vi.useFakeTimers();
	apm.captureException.mockClear();
});

afterEach(() => {
	vi.useRealTimers();
});

const renderOfficeSearch = async (locale?: AppLocale) => {
	({ user } = await renderAndSettle(
		locale ? (
			<LocaleProvider value={locale}>
				<OfficeSearch />
			</LocaleProvider>
		) : (
			<OfficeSearch />
		),
	));
};

describe('OfficeSearch', () => {
	beforeEach(async () => {
		await renderOfficeSearch();
	});

	describe('validering og feil', () => {
		test.each([
			{ name: 'server-feil', reply: { status: 500 }, message: 'Ukjent server-feil' },
			{
				name: 'søk på postnummer som ikke finnes',
				reply: { status: 404, json: errorResult('errorInvalidPostnr') },
				message: 'Postnummeret finnes ikke',
			},
		] satisfies { name: string; reply: Reply; message: string }[])(
			'gir feilmelding ved $name',
			async ({ reply, message }) => {
				mockApi('search', reply);
				await searchFor('0000');

				expect(await screen.findByText(message)).toBeInTheDocument();
				expect(apiRequests()).toEqual(['search?query=0000']);
			},
		);

		test('rapporterer til APM når søket feiler uten et svar appen kan lese', async () => {
			mockApi('search', { status: 500 });
			await searchFor('0000');

			expect(await screen.findByText('Ukjent server-feil')).toBeInTheDocument();
			expect(apm.captureException).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { fingerprint: 'fetch.search' });
		});

		test('rapporterer ikke til APM når serveren svarer med en feil appen kjenner', async () => {
			mockApi('search', { status: 404, json: errorResult('errorInvalidPostnr') });
			await searchFor('0000');

			expect(await screen.findByText('Postnummeret finnes ikke')).toBeInTheDocument();
			expect(apm.captureException).not.toHaveBeenCalled();
		});

		test.each([
			{ name: 'tomt input-felt', query: '', message: 'Skriv inn minst to bokstaver eller et postnummer' },
			{ name: 'feil antall siffer', query: '11', message: 'Postnummer-søk må være fire siffer' },
			{ name: 'ugyldige tegn', query: 'evje@', message: 'Søket inneholder ugyldige tegn' },
		])('gir valideringsfeil ved $name', async ({ query, message }) => {
			await searchFor(query);

			expect(screen.getByText(message)).toBeInTheDocument();
			expect(apiRequests()).toEqual([]);
		});

		test('viser valideringsfeil for ugyldige tegn mens brukeren skriver', async () => {
			await user.type(getSearchInput(), '@');

			expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();
			await waitForDebounce();
			expect(apiRequests()).toEqual([]);
		});

		test('viser feilmelding i stedet for et resultat som ikke kan vises, og neste søk fungerer', async () => {
			// React logs the render error
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			const unrenderable = { type: 'name', input: 'oslo', hits: [{ name: 'OSLO' }] } as unknown as SearchResultProps;
			mockApi('search', { json: unrenderable });
			await searchFor('oslo');

			expect(await screen.findByText('Server-feil: Feil i søke-resultatet')).toBeInTheDocument();
			expect(getSearchInput()).toHaveValue('oslo');

			mockApi('search', { json: nameResult('oslo sentrum', [nameHit('OSLO', [offices.alna])]) });
			await searchFor(' sentrum');

			expect(await findLink('Nav Alna')).toBeInTheDocument();
			expect(screen.queryByText('Server-feil: Feil i søke-resultatet')).not.toBeInTheDocument();
		});

		test('fjerner gamle søkeresultater når input blir for kort', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const input = getSearchInput();
			await user.type(input, 'e', { initialSelectionStart: 0, initialSelectionEnd: input.value.length });

			expect(input).toHaveValue('e');
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
			await waitForDebounce();
			expect(apiRequests()).toEqual(['search?query=evje+og+hornnes']);
		});

		test.each([
			{ name: 'tre siffer', type: '{Backspace}', value: '473' },
			{ name: 'fem siffer', type: '1', value: '47371' },
		])('fjerner gamle søkeresultater når input blir et tall med $name', async ({ type, value }) => {
			mockApi('search', { json: postnrResult() });
			await typeQuery('4737');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const input = getSearchInput();
			await user.type(input, type);

			expect(input).toHaveValue(value);
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
			expect(screen.queryByText('Postnummer-søk må være fire siffer')).not.toBeInTheDocument();
			await waitForDebounce();
			expect(apiRequests()).toEqual(['search?query=4737']);
		});
	});

	describe('postnummersøk', () => {
		test.each([
			{
				name: 'postnr uten kontorer',
				result: postnrResult({ officeInfo: [] }),
				header: 'Ingen Nav-kontor funnet for 4737 HORNNES',
			},
			{
				name: 'postnr med ett kontor',
				result: postnrResult(),
				header: 'Nav-kontor for 4737 HORNNES:',
			},
			{
				name: 'postnr med flere kontor',
				result: postnrResult({ officeInfo: [offices.evjeOgHornnes, offices.testkontor] }),
				header: '2 kontorer dekker 4737 HORNNES',
			},
			{
				name: 'postnummer for postbokser',
				result: osloPostnrResult('0614', PostnrKategori.Postbokser),
				header: '0614 er et postnummer for postbokser i OSLO kommune. Kommunens Nav-kontorer:',
			},
			{
				name: 'servicepostnummer',
				result: osloPostnrResult('0614', PostnrKategori.Servicepostnummer),
				header: '0614 er et servicepostnummer i OSLO kommune. Kommunens Nav-kontorer:',
			},
			{
				name: 'postnummer som dekkes av flere bydeler',
				result: osloPostnrResult('0354', PostnrKategori.Gateadresser),
				header: '3 kontorer dekker 0354 OSLO',
			},
		])('gir riktig respons ved søk på $name', async ({ result, header }) => {
			mockApi('search', { json: result });
			await searchFor(result.postnr);

			expect(await findByFullText(header)).toBeInTheDocument();
			expect(screen.queryAllByRole('link', { name: /^Nav / })).toHaveLength(result.officeInfo.length);
			for (const office of result.officeInfo) {
				expect(getLink(office.name)).toHaveAttribute('href', office.url);
			}
			expect(apiRequests()).toEqual([`search?query=${result.postnr}`]);
		});

		test('fortsetter postnummersøket når fokus forlater feltet mens det laster', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('4737');
			await advance(SPINNER_DELAY_MS);
			expect(screen.getByLabelText('Søker...', { selector: 'div' })).toBeInTheDocument();

			await user.click(document.body);

			expect(wasAborted('search?query=4737')).toBe(false);
			expect(screen.getByLabelText('Søker...', { selector: 'div' })).toBeInTheDocument();
			search.resolve({ json: postnrResult() });
			expect(await findByFullText('Nav-kontor for 4737 HORNNES:')).toBeInTheDocument();
		});

		test('viser lasteindikator først etter forsinkelsen', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('4737');

			expect(apiRequests()).toEqual(['search?query=4737']);
			await advance(SPINNER_DELAY_MS - 1);
			expect(queryLoadingIndicators()).toHaveLength(0);

			await advance(1);
			expect(screen.getByLabelText('Søker...', { selector: 'div' })).toHaveAttribute('aria-busy', 'true');
			expect(getLiveRegion()).toHaveTextContent(/^Søker\.\.\.$/);

			search.resolve({ json: postnrResult() });
			expect(await findByFullText('Nav-kontor for 4737 HORNNES:')).toBeInTheDocument();
			expect(queryLoadingIndicators()).toHaveLength(0);
		});
	});

	describe('stedsnavnsøk', () => {
		test('gir riktig respons ved søk på stedsnavn med søketreff', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');

			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expectSingleHitFor('evje og hornnes');
			expect(apiRequests()).toEqual(['search?query=evje+og+hornnes']);
		});

		test('uthever treffene etter søket som fant dem, også mens brukeren skriver videre', async () => {
			mockApi('search', { json: nameResult('frogner', [nameHit('Frogner', [offices.frogner])]) });
			await searchFor('frogner');
			expect(await findLink('Nav Frogner')).toBeInTheDocument();
			expect(getHighlightedHitParts('Frogner')).toEqual(['Frogner']);

			mockApi('search', pending);
			await user.type(getSearchInput(), '{Backspace}{Backspace}{Backspace}');

			expect(getSearchInput()).toHaveValue('frog');
			expect(getHighlightedHitParts('Frogner')).toEqual(['Frogner']);
		});

		test('gir serverfeil når søket feiler, uten å søke en gang til', async () => {
			mockApi('search', { status: 500 });
			await searchFor('evje og hornnes');

			expect(await screen.findByText('Ukjent server-feil')).toBeInTheDocument();
			await advance(SPINNER_DELAY_MS);
			expect(queryLoadingIndicators()).toHaveLength(0);
			expect(apiRequests()).toEqual(['search?query=evje+og+hornnes']);
		});

		test('gir riktig respons ved søk på stedsnavn uten søketreff, med ett kall', async () => {
			mockAddressSuggestions('evje og hornnes', []);
			await searchFor('evje og hornnes');

			expect(await screen.findByRole('option', { name: 'Ingen resultater for "evje og hornnes"' })).toBeInTheDocument();
			expect(apiRequests()).toEqual(['search?query=evje+og+hornnes']);
		});

		test('viser lasting i adresseforslagene når søket tar tid, og kontorene når svaret er et stedsnavn', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('evje og hornnes');

			await advance(SPINNER_DELAY_MS - 1);
			expect(queryLoadingIndicators()).toHaveLength(0);
			await advance(1);
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();
			expect(getLiveRegion()).toHaveTextContent(/^Søker\.\.\.$/);

			search.resolve({ json: evjeNameResult });

			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(getSearchInput()).toHaveAttribute('aria-expanded', 'false');
			expect(getLiveRegion()).toBeEmptyDOMElement();
		});

		test('sender ett søk når debounce-tiden har gått etter siste tastetrykk', async () => {
			mockApi('search', { json: nameResult('oslo', [nameHit('OSLO', [offices.alna])]) });
			await user.click(getSearchInput());
			// Pause just under the debounce between keystrokes: each one restarts it
			for (const char of 'oslo') {
				await user.keyboard(char);
				await advance(SEARCH_DEBOUNCE_MS - 1);
			}

			expect(apiRequests()).toEqual([]);
			await advance(1);

			expect(await findLink('Nav Alna')).toBeInTheDocument();
			expect(apiRequests()).toEqual(['search?query=oslo']);
		});
	});

	describe('adresseforslag', () => {
		test.each([
			{ name: 'postnummer med gatenavn', query: '4737 storgata 1', encoded: '4737+storgata+1' },
			{ name: 'adresse med punktum', query: 'ole b. bergers veg', encoded: 'ole+b.+bergers+veg' },
		])('sender $name som ett søk', async ({ query, encoded }) => {
			mockAddressSuggestions(query, storgataAdresser(1));
			await searchFor(query);

			expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			expect(screen.queryByText('Søket inneholder ugyldige tegn')).not.toBeInTheDocument();
			expect(apiRequests()).toEqual([`search?query=${encoded}`]);
		});

		test('gir riktig respons ved adressesøk uten søketreff', async () => {
			mockAddressSuggestions('ukjent adresse 1', []);
			await searchFor('ukjent adresse 1');

			const option = await screen.findByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' });
			expect(option).toHaveAttribute('aria-disabled', 'true');
			const input = getSearchInput();
			expect(input).toHaveAccessibleName('Skriv inn adresse, postnummer eller sted/by');
			expect(input).toHaveAttribute('aria-expanded', 'true');
			expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
			expect(input).toHaveAttribute('autocomplete', 'off');
			expect(input).toHaveAttribute('autocorrect', 'off');
			expect(input).toHaveAttribute('autocapitalize', 'none');
			expect(input).toHaveAttribute('spellcheck', 'false');
			expect(getLiveRegion()).toHaveTextContent(/^Ingen resultater for "ukjent adresse 1"$/);
		});

		test.each([
			{
				name: 'gatenavn og husnummer',
				query: 'storgata 1',
				adresse: adresse(),
				parts: ['Storgata', '1', '1'],
			},
			{
				name: 'ikke ord som bare matcher fuzzy',
				query: 'bull aakrans 5',
				adresse: adresse({
					adressenavn: 'Bull Aakranns vei',
					husnummer: 5,
					postnummer: '7374',
					poststed: 'RØROS',
					kommunenummer: '5025',
					bydelsnummer: null,
				}),
				parts: ['Bull', '5'],
			},
			{
				name: 'lengre treff foran kortere overlappende treff',
				query: 'ole b berger',
				adresse: adresse({
					adressenavn: 'Ole B. Bergers veg',
					husnummer: 5,
					postnummer: '3520',
					poststed: 'JEVNAKER',
					kommunenummer: '3236',
					bydelsnummer: null,
				}),
				parts: ['Ole', 'B', 'Berger'],
			},
		])('uthever $name i adresseforslag', async ({ query, adresse, parts }) => {
			mockAddressSuggestions(query, [adresse]);
			await searchFor(query);

			const label = formatAddressLabel(adresse);
			await screen.findByRole('option', { name: label });
			expect(getHighlightedAddressParts(label)).toEqual(parts);
		});

		test('beholder mellomrom rundt uthevet ord i adresseforslag', async () => {
			mockAddressSuggestions('Storgata', storgataAdresser(2));
			await searchFor('Storgata');

			const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			expect(option).toHaveTextContent(/^Storgata 1, 0184 OSLO$/);
			expect(option.querySelector('span')).toHaveTextContent(/^Storgata 1, 0184 OSLO$/);
			expect(option.querySelector('strong')).toHaveTextContent(/^Storgata$/);
		});

		test.each([
			{
				visible: 10,
				totalHits: 30,
				hint: 'Viser 10 av 30 adresseforslag. Skriv mer av adressen for å avgrense søket.',
			},
			{
				visible: 10,
				totalHits: 10,
				hint: 'Viser 10 av 10 adresseforslag. Skriv mer av adressen for å avgrense søket.',
			},
			{ visible: 6, totalHits: 6, hint: null },
		])('avgrensningshint for $visible synlige av $totalHits treff: $hint', async ({ visible, totalHits, hint }) => {
			mockAddressSuggestions('storgata 1', storgataAdresser(visible), totalHits);
			await searchFor('storgata 1');

			expect(await screen.findByRole('option', { name: `Storgata ${visible}, 0184 OSLO` })).toBeInTheDocument();
			const available = `${visible} adresseforslag tilgjengelig. Bruk piltastene for å velge.`;
			if (hint) {
				expect(screen.getByRole('listbox')).not.toContainElement(screen.getByText(hint));
				expectLiveRegion(`${available} ${hint}`);
			} else {
				expect(screen.queryByText(/^Viser \d+ av \d+ adresseforslag/)).not.toBeInTheDocument();
				expectLiveRegion(available);
			}
		});

		test('fjerner gamle søkeresultater og viser lasting når et nytt søk tar tid', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await replaceQuery('ukjent adresse 1');
			await waitForDebounce();

			expect(apiRequests()).toContain('search?query=ukjent+adresse+1');
			expect(getLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(queryLoadingIndicators()).toHaveLength(0);

			await advance(SPINNER_DELAY_MS);

			const loadingOption = screen.getByRole('option', { name: 'Søker...' });
			expect(loadingOption).toHaveAttribute('aria-disabled', 'true');
			expect(getSearchInput()).toHaveAttribute('aria-expanded', 'true');
			expect(getSearchInput()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();

			search.resolve({ json: addressResult('ukjent adresse 1', []) });

			expect(
				await screen.findByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' }),
			).toBeInTheDocument();
		});

		test('beholder høyden fra forrige adresseforslag mens nye adresseforslag lastes', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');

			await screen.findByRole('option', { name: 'Storgata 2, 0184 OSLO' });
			const previousDropdown = screen.getByRole('listbox').closest('[data-result-type]');
			expect(previousDropdown).toHaveAttribute('data-result-type', 'adresse');
			vi.spyOn(previousDropdown as HTMLElement, 'getBoundingClientRect').mockReturnValue(
				DOMRect.fromRect({ width: 480, height: 240 }),
			);

			mockApi('search', pending);
			await replaceQuery('storgata 2');
			await waitForDebounce();
			await advance(SPINNER_DELAY_MS);

			expect(screen.getByRole('listbox')).toHaveStyle({ height: '240px' });
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();
		});

		test('lasting av adresseforslag tar ikke høyden fra et vanlig søkeresultat', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			const previousResult = (await findLink('Nav Evje og Hornnes')).closest('[data-result-type]');
			expect(previousResult).toHaveAttribute('data-result-type', 'name');
			vi.spyOn(previousResult as HTMLElement, 'getBoundingClientRect').mockReturnValue(
				DOMRect.fromRect({ width: 480, height: 300 }),
			);

			mockApi('search', pending);
			await replaceQuery('storgata 2');
			await waitForDebounce();
			await advance(SPINNER_DELAY_MS);

			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();
			expect(screen.getByRole('listbox')).not.toHaveAttribute('style');
		});

		test('lasteindikatoren for postnummer tar høyden fra resultatet den erstatter', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			const previousResult = (await findLink('Nav Evje og Hornnes')).closest('[data-result-type]');
			vi.spyOn(previousResult as HTMLElement, 'getBoundingClientRect').mockReturnValue(
				DOMRect.fromRect({ width: 480, height: 300 }),
			);

			mockApi('search', pending);
			await replaceQuery('4737');
			await waitForDebounce();
			await advance(SPINNER_DELAY_MS);

			expect(screen.getByLabelText('Søker...', { selector: 'div' })).toHaveStyle({ height: '300px' });
		});

		test('bytter gamle søkeresultater med nye uten lasting når svaret kommer raskt', async () => {
			mockApi('search', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await replaceQuery('kristiansand');
			await waitForDebounce();
			await advance(SPINNER_DELAY_MS - 1);

			expect(apiRequests()).toContain('search?query=kristiansand');
			expect(getLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(queryLoadingIndicators()).toHaveLength(0);

			search.resolve({
				json: nameResult('kristiansand', [nameHit('KRISTIANSAND', [offices.kristiansand])]),
			});

			expect(await findLink('Nav Kristiansand')).toBeInTheDocument();
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
			// The spinner that was a millisecond away never comes
			await advance(SPINNER_DELAY_MS);
			expect(queryLoadingIndicators()).toHaveLength(0);
			expect(getLink('Nav Kristiansand')).toBeInTheDocument();
		});
	});

	describe('tastatur og mus i adresseforslag', () => {
		test('kan navigere adresseforslag med piltaster og velge med enter', async () => {
			const scrollIntoView = stubScrollIntoView();
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			const input = getSearchInput();

			const firstOption = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			const secondOption = screen.getByRole('option', { name: 'Storgata 2, 0184 OSLO' });
			expect(input).toHaveAttribute('aria-expanded', 'true');
			expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);

			await user.keyboard('{ArrowDown}');
			expect(firstOption).toHaveAttribute('aria-selected', 'true');
			expect(input).toHaveAttribute('aria-activedescendant', firstOption.id);
			expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });

			await user.keyboard('{ArrowDown}');
			expect(secondOption).toHaveAttribute('aria-selected', 'true');
			expect(input).toHaveAttribute('aria-activedescendant', secondOption.id);

			await user.keyboard('{Enter}');

			expect(input).toHaveValue('Storgata 2, 0184 OSLO');
			expect(getLink('Nav Grünerløkka')).toBeInTheDocument();
			expectSingleHitFor('Storgata 2, 0184 OSLO');
			expect(getLiveRegion()).toHaveTextContent(/^Adresse valgt: Storgata 2, 0184 OSLO$/);
			// The address came with its office, so picking it asks for nothing
			await waitForDebounce();
			expect(apiRequests()).toEqual(['search?query=storgata+1']);
		});

		test('pil opp starter nederst og stopper øverst', async () => {
			mockAddressSuggestions('storgata', storgataAdresser(3));
			await typeQuery('storgata');
			await screen.findByRole('option', { name: 'Storgata 3, 0184 OSLO' });
			const [first, second, third] = screen.getAllByRole('option');

			await user.keyboard('{ArrowUp}');
			expect(third).toHaveAttribute('aria-selected', 'true');
			await user.keyboard('{ArrowUp}');
			expect(second).toHaveAttribute('aria-selected', 'true');
			await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
			expect(first).toHaveAttribute('aria-selected', 'true');
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
			expect(third).toHaveAttribute('aria-selected', 'true');
		});

		test('enter uten aktivt adresseforslag starter ikke søket på nytt', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			const requestsBeforeEnter = apiRequests();

			await user.keyboard('{Enter}');
			await waitForDebounce();

			expect(apiRequests()).toEqual(requestsBeforeEnter);
			expect(screen.getByRole('listbox')).toBeInTheDocument();
			expect(getSearchInput()).toHaveValue('storgata 1');
		});

		test('enter velger eneste adresseforslag uten piltastnavigering', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(1));
			await typeQuery('storgata 1');
			const input = getSearchInput();

			const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			expect(input).not.toHaveAttribute('aria-activedescendant');
			expect(option).toHaveAttribute('aria-selected', 'false');

			await user.keyboard('{Enter}');

			expect(input).toHaveValue('Storgata 1, 0184 OSLO');
			expect(getLink('Nav Grünerløkka')).toBeInTheDocument();
			expectSingleHitFor('Storgata 1, 0184 OSLO');
		});

		test('enter velger ikke utdatert eneste adresseforslag når input er endret', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(1));
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			// Still showing the suggestion for "storgata 1" while the new query waits for the debounce
			await user.keyboard('2');
			expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			await user.keyboard('{Enter}');

			expect(getSearchInput()).toHaveValue('storgata 12');
			expect(screen.queryByRole('link', { name: 'Nav Grünerløkka' })).not.toBeInTheDocument();
			expect(screen.queryByText(/treff for/)).not.toBeInTheDocument();
		});

		test('musepeker over adresseforslag trigger ikke automatisk scrolling', async () => {
			const scrollIntoView = stubScrollIntoView();
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');

			const secondOption = await screen.findByRole('option', { name: 'Storgata 2, 0184 OSLO' });
			await user.hover(secondOption);

			expect(secondOption).toHaveAttribute('aria-selected', 'true');
			expect(scrollIntoView).not.toHaveBeenCalled();
		});

		test('kan velge adresseforslag med mus', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');

			await user.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));

			expect(getSearchInput()).toHaveValue('Storgata 1, 0184 OSLO');
			expect(getSearchInput()).toHaveFocus();
			expect(getLink('Nav Grünerløkka')).toBeInTheDocument();
			expectSingleHitFor('Storgata 1, 0184 OSLO');
		});

		test('beholder overskriften for valgt adresse mens brukeren skriver videre', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			await user.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));
			expect(getLink('Nav Grünerløkka')).toBeInTheDocument();

			mockApi('search', pending);
			await user.type(getSearchInput(), 'x');
			expectSingleHitFor('Storgata 1, 0184 OSLO');

			await waitForDebounce();
			expect(apiRequests()).toContain('search?query=Storgata+1%2C+0184+OSLOx');
			expect(getLink('Nav Grünerløkka')).toBeInTheDocument();
			expectSingleHitFor('Storgata 1, 0184 OSLO');
		});

		test('viser kontoret til adressen som velges, også når forslagene har ulike kontor', async () => {
			const tamburveien = adresse({
				adressenavn: 'Tamburveien',
				husnummer: 1,
				husbokstav: 'A',
				postnummer: '1406',
				poststed: 'SKI',
				kommunenummer: '3218',
				bydelsnummer: null,
				officeInfo: offices.nordreFollo,
			});
			mockAddressSuggestions('tamburveien 1a', [adresse(), tamburveien]);
			await typeQuery('tamburveien 1a');

			await user.click(await screen.findByRole('option', { name: 'Tamburveien 1A, 1406 SKI' }));

			expect(getLink('Nav Nordre Follo')).toHaveAttribute('href', offices.nordreFollo.url);
			expect(screen.queryByRole('link', { name: 'Nav Grünerløkka' })).not.toBeInTheDocument();
			expectSingleHitFor('Tamburveien 1A, 1406 SKI');
			expect(apiRequests()).toEqual(['search?query=tamburveien+1a']);
		});

		test('gir feilmelding og tømmer statusmeldingen når valgt adresse ikke har noe kontor', async () => {
			mockAddressSuggestions('fergeleiet 1', [
				adresse({
					adressenavn: 'Fergeleiet',
					postnummer: '5004',
					poststed: 'BERGEN',
					kommunenummer: null,
					bydelsnummer: null,
					officeInfo: null,
				}),
			]);
			await typeQuery('fergeleiet 1');

			await user.click(await screen.findByRole('option', { name: 'Fergeleiet 1, 5004 BERGEN' }));

			expect(screen.getByText('Ukjent server-feil')).toBeInTheDocument();
			expect(getSearchInput()).toHaveValue('Fergeleiet 1, 5004 BERGEN');
			expect(screen.queryByRole('link', { name: /^Nav / })).not.toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();
		});
	});

	describe('lukke og åpne adresseforslag', () => {
		test.each([
			{ name: 'escape', close: () => user.keyboard('{Escape}'), keepsFocus: true, adresser: storgataAdresser(2) },
			{ name: 'escape på tom liste', close: () => user.keyboard('{Escape}'), keepsFocus: true, adresser: [] },
			{ name: 'tab', close: () => user.tab(), keepsFocus: false, adresser: storgataAdresser(2) },
			{
				name: 'klikk utenfor',
				close: () => user.click(document.body),
				keepsFocus: false,
				adresser: storgataAdresser(2),
			},
		])(
			'$name lukker adresseforslag uten å tømme feltet, og fokus åpner dem igjen',
			async ({ close, keepsFocus, adresser }) => {
				mockAddressSuggestions('storgata 1', adresser);
				await typeQuery('storgata 1');
				const input = getSearchInput();
				const optionName = adresser.length > 0 ? 'Storgata 1, 0184 OSLO' : 'Ingen resultater for "storgata 1"';
				await screen.findByRole('option', { name: optionName });

				await close();

				expect(input).toHaveValue('storgata 1');
				expect(input).toHaveAttribute('aria-expanded', 'false');
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
				if (keepsFocus) {
					expect(input).toHaveFocus();
				} else {
					expect(input).not.toHaveFocus();
				}

				await refocusSearchInput();
				expect(screen.getByRole('option', { name: optionName })).toBeInTheDocument();
			},
		);

		test.each([
			{ name: 'mens søket pågår', leave: 'search' },
			{ name: 'før søket starter', leave: 'debounce' },
		])(
			'åpner ikke adresseforslag når fokus forlot feltet $name, men viser dem når det får fokus igjen',
			async ({ leave }) => {
				const search = Promise.withResolvers<Reply>();
				mockApi('search', search.promise);
				const input = getSearchInput();
				await user.type(input, 'storgata 1');
				if (leave === 'search') {
					await waitForDebounce();
				}

				await user.click(document.body);
				await waitForDebounce();
				await advance(SPINNER_DELAY_MS);
				expect(apiRequests()).toEqual(['search?query=storgata+1']);

				// No spinner while the addresses load, in the dropdown or elsewhere
				expect(input).toHaveAttribute('aria-expanded', 'false');
				expect(queryLoadingIndicators()).toHaveLength(0);

				search.resolve({ json: addressResult('storgata 1', storgataAdresser(2)) });
				await act(() => vi.runOnlyPendingTimersAsync());

				expect(input).toHaveAttribute('aria-expanded', 'false');
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

				await user.click(input);
				expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
				expect(input).toHaveAttribute('aria-expanded', 'true');
			},
		);

		test('escape to ganger lukker først forslagene og tømmer deretter feltet', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			await user.keyboard('{Escape}');
			expect(input).toHaveValue('storgata 1');

			await user.keyboard('{Escape}');
			expect(input).toHaveValue('');
			expect(input).toHaveFocus();

			await refocusSearchInput();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		test('tøm-knappen tømmer feltet, lukker adresseforslag og fjerner feilmelding', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			await user.click(screen.getByRole('button', { name: 'Tøm feltet' }));

			const input = getSearchInput();
			expect(input).toHaveValue('');
			expect(input).toHaveFocus();
			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();

			await user.type(input, 'evje@');
			expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();
			await user.click(screen.getByRole('button', { name: 'Tøm feltet' }));
			expect(screen.queryByText('Søket inneholder ugyldige tegn')).not.toBeInTheDocument();
		});

		test('escape lukker lastingen i adresseforslagene, avbryter søket og ignorerer sent svar', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('ukjent adresse 1');
			await advance(SPINNER_DELAY_MS);
			const input = getSearchInput();
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();

			await user.keyboard('{Escape}');

			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(wasAborted('search?query=ukjent+adresse+1')).toBe(true);
			expect(input).toHaveFocus();

			search.resolve({ json: addressResult('ukjent adresse 1', storgataAdresser(2)) });
			await act(() => vi.runOnlyPendingTimersAsync());

			expect(input).toHaveValue('ukjent adresse 1');
			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();
			await refocusSearchInput();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		// Leaving the field doesn't stop the search: what it finds may be offices, which aren't in the dropdown
		test.each([
			{ name: 'tab', leave: () => user.tab() },
			{ name: 'klikk utenfor', leave: () => user.click(document.body) },
		])(
			'$name lukker lastingen i adresseforslagene, og adressene venter til feltet får fokus igjen',
			async ({ leave }) => {
				const search = Promise.withResolvers<Reply>();
				mockApi('search', search.promise);
				await typeQuery('storgata 1');
				await advance(SPINNER_DELAY_MS);
				const input = getSearchInput();
				expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();

				await leave();

				expect(input).not.toHaveFocus();
				expect(input).toHaveAttribute('aria-expanded', 'false');
				expect(queryLoadingIndicators()).toHaveLength(0);
				expect(wasAborted('search?query=storgata+1')).toBe(false);

				search.resolve({ json: addressResult('storgata 1', storgataAdresser(2)) });
				await act(() => vi.runOnlyPendingTimersAsync());

				expect(input).toHaveAttribute('aria-expanded', 'false');
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

				await user.click(input);
				expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
				expect(input).toHaveAttribute('aria-expanded', 'true');
			},
		);

		test('viser kontorene for et stedsnavn selv om fokus forlot feltet mens søket lastet', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('evje og hornnes');
			await advance(SPINNER_DELAY_MS);
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();

			await user.click(document.body);
			search.resolve({ json: evjeNameResult });

			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(wasAborted('search?query=evje+og+hornnes')).toBe(false);
		});

		test('viser ingen feil når brukeren avbryter et søk', async () => {
			mockApi('search', pending);
			await typeQuery('storgata 1');
			await advance(SPINNER_DELAY_MS);
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();

			await user.keyboard('{Escape}');
			await waitForDebounce();

			expect(wasAborted('search?query=storgata+1')).toBe(true);
			expect(screen.queryByText('Ukjent server-feil')).not.toBeInTheDocument();
		});

		test('avbryter søket som pågår når skjemaet forsvinner', async () => {
			mockApi('search', Promise.withResolvers<Reply>().promise);
			await typeQuery('oslo');
			expect(apiRequests()).toEqual(['search?query=oslo']);

			cleanup();

			expect(wasAborted('search?query=oslo')).toBe(true);
		});
	});
});

describe('innloggingsknapp', () => {
	test.each([
		[false, 'Logg inn og se ditt Nav-kontor'],
		[true, 'Se ditt Nav-kontor'],
	])('innlogget=%s viser "%s"', async (isUserLoggedIn, text) => {
		mockApi('loginstatus', { json: { isUserLoggedIn } });
		await renderOfficeSearch();

		// Aksel's Button as="a" keeps role="button" on the anchor
		expect(screen.getByRole('button', { name: text })).toHaveAttribute(
			'href',
			'/person/personopplysninger/nb/#ditt-nav-kontor',
		);
	});
});

describe('språk', () => {
	const texts = {
		nn: {
			label: 'Skriv inn adresse, postnummer eller stad/by',
			login: 'Logg inn og sjå ditt Nav-kontor',
			postnrNone: 'Ingen Nav-kontor funne for 4737 HORNNES',
			validation: 'Søket inneheld ugyldige teikn',
			suggestions: '2 adresseforslag tilgjengeleg. Bruk piltastane for å velje.',
			clear: 'Tøm feltet',
		},
		en: {
			label: 'Enter address, post code or town/city',
			login: 'Log in to see your Nav office',
			postnrNone: 'No Nav office found for 4737 HORNNES',
			validation: 'Invalid characters in search',
			suggestions: '2 address suggestions available. Use the arrow keys to choose.',
			clear: 'Clear field',
		},
	} satisfies Partial<Record<AppLocale, Record<string, string>>>;

	test.each(['nn', 'en'] as const)('viser tekster og resultater på %s', async (locale) => {
		const t = texts[locale];
		mockApi('search', { json: postnrResult({ officeInfo: [] }) });
		await renderOfficeSearch(locale);

		const input = screen.getByRole('combobox', { name: t.label });
		expect(screen.getByRole('button', { name: t.login })).toHaveAttribute(
			'href',
			`/person/personopplysninger/${locale}/#ditt-nav-kontor`,
		);

		await user.type(input, '@');
		expect(screen.getByText(t.validation)).toBeInTheDocument();

		await user.clear(input);
		await user.type(input, '4737');
		await user.keyboard('{Enter}');
		await waitForDebounce();
		expect(await findByFullText(t.postnrNone)).toBeInTheDocument();

		await user.clear(input);
		mockAddressSuggestions('storgata 1', storgataAdresser(2));
		await typeQuery('storgata 1');
		await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
		expect(getLiveRegion()).toHaveTextContent(new RegExp(`^${escapeRegExp(t.suggestions)}$`));

		// Aksel's own string
		expect(screen.getByRole('button', { name: t.clear })).toBeInTheDocument();
	});
});

/** A reply that never arrives */
const pending = new Promise<Reply>(() => undefined);

const evjeNameResult = nameResult('evje og hornnes', [nameHit('EVJE OG HORNNES', [offices.evjeOgHornnes])]);

/** What the search answers when no name matches: the addresses it found */
const mockAddressSuggestions = (query: string, adresser: ReturnType<typeof storgataAdresser>, totalHits?: number) => {
	mockApi('search', { json: addressResult(query, adresser, totalHits) });
};

const getSearchInput = (): HTMLInputElement => screen.getByRole('combobox');

const getLink = (name: string) => screen.getByRole('link', { name });

const findLink = (name: string) => screen.findByRole('link', { name });

const normalizedText = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim();

/** The innermost element whose whole text content equals the text, even across child elements */
const findByFullText = (text: string) =>
	screen.findByText(
		(_, element) =>
			!!element &&
			normalizedText(element) === text &&
			Array.from(element.children).every((child) => normalizedText(child) !== text),
	);

const expectSingleHitFor = (query: string) => {
	expect(screen.getByText(/^\d+ treff for/)).toHaveTextContent(new RegExp(`^1 treff for "${escapeRegExp(query)}":$`));
};

/** The highlighted parts of a name hit's heading */
const getHighlightedHitParts = (name: string) =>
	Array.from(
		screen
			.getByText((_, element) => element?.tagName === 'P' && element.textContent === name)
			.querySelectorAll('strong'),
		(element) => element.textContent,
	);

const getHighlightedAddressParts = (name: string) =>
	Array.from(screen.getByRole('option', { name }).querySelectorAll('strong'), (element) => element.textContent);

/** The search form's own status region. Aksel's error message region is also aria-live, so match exactly one. */
const getLiveRegion = () => {
	const regions = document.querySelectorAll<HTMLElement>('.aksel-sr-only[aria-live="polite"]');
	expect(regions).toHaveLength(1);
	return regions[0];
};

const expectLiveRegion = (text: string) => {
	expect(getLiveRegion()).toHaveTextContent(new RegExp(`^${escapeRegExp(text)}$`));
};

const queryLoadingIndicators = () => screen.queryAllByLabelText('Søker...');

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const waitForDebounce = () => advance(SEARCH_DEBOUNCE_MS);

/** Types into the search field (focusing it first) and lets the debounce fire */
const typeQuery = async (query: string) => {
	await user.type(getSearchInput(), query);
	await waitForDebounce();
};

/** Types the query, submits with Enter, and lets the debounce fire */
const searchFor = async (query: string) => {
	const input = getSearchInput();
	if (query) {
		await user.type(input, query);
	} else {
		await user.click(input);
	}
	await user.keyboard('{Enter}');
	await waitForDebounce();
};

/** Replaces the whole query in one change event, like a paste over a selection */
const replaceQuery = async (query: string) => {
	const input = getSearchInput();
	input.setSelectionRange(0, input.value.length);
	await user.paste(query);
};

const refocusSearchInput = async () => {
	await user.click(document.body);
	await user.click(getSearchInput());
};

const stubScrollIntoView = () => {
	const scrollIntoView = vi.fn();
	Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: scrollIntoView, configurable: true });
	onTestFinished(() => {
		delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
	});
	return scrollIntoView;
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
