import { act, screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { PostnrKategori } from '../../../common/types/data';
import type { AppLocale } from '../../../common/localization/types';
import { OfficeSearch } from '../components/OfficeSearch';
import { formatAddressLabel } from '../components/SearchResult/SearchResultAdresse/addressSuggestions';
import { POSTNR_SPINNER_DELAY_MS, SEARCH_DEBOUNCE_MS } from '../components/SearchForm/SearchForm';
import { LocaleProvider } from '../localization/useLocale';
import {
	addressResult,
	adresse,
	errorResult,
	geoidResult,
	nameHit,
	nameResult,
	offices,
	osloPostnrResult,
	postnrResult,
	storgataAdresser,
} from './support/fixtures';
import { apiRequests, mockApi, type Reply, wasAborted } from './support/msw';
import { renderAndSettle } from './support/render';

let user: UserEvent;

beforeEach(() => {
	vi.useFakeTimers();
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

		test('fjerner gamle søkeresultater når input blir for kort', async () => {
			mockApi('search/name', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const input = getSearchInput();
			await user.type(input, 'e', { initialSelectionStart: 0, initialSelectionEnd: input.value.length });

			expect(input).toHaveValue('e');
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
			await waitForDebounce();
			expect(apiRequests()).toEqual(['search/name?query=evje%20og%20hornnes']);
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

		test('viser lasteindikator først etter forsinkelsen', async () => {
			const search = Promise.withResolvers<Reply>();
			mockApi('search', search.promise);
			await typeQuery('4737');

			expect(apiRequests()).toEqual(['search?query=4737']);
			await advance(POSTNR_SPINNER_DELAY_MS - 1);
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
			mockApi('search/name', { json: evjeNameResult });
			await searchFor('evje og hornnes');

			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expectSingleHitFor('evje og hornnes');
			expect(apiRequests()).toEqual(['search/name?query=evje%20og%20hornnes']);
		});

		test('gir serverfeil og hopper over adressefallback når stedsnavnsøk feiler', async () => {
			mockApi('search/name', { status: 500 });
			await searchFor('evje og hornnes');

			expect(await screen.findByText('Ukjent server-feil')).toBeInTheDocument();
			expect(apiRequests()).toEqual(['search/name?query=evje%20og%20hornnes']);
		});

		test('gir riktig respons ved søk på stedsnavn uten søketreff', async () => {
			mockAddressSuggestions('evje og hornnes', []);
			await searchFor('evje og hornnes');

			expect(await screen.findByRole('option', { name: 'Ingen resultater for "evje og hornnes"' })).toBeInTheDocument();
			expect(apiRequests()).toEqual([
				'search/name?query=evje%20og%20hornnes',
				'search/address?query=evje%20og%20hornnes',
			]);
		});

		test('sender ett søk når debounce-tiden har gått etter siste tastetrykk', async () => {
			mockApi('search/name', { json: nameResult('oslo', [nameHit('OSLO', [offices.alna])]) });
			await user.click(getSearchInput());
			// Pause just under the debounce between keystrokes: each one restarts it
			for (const char of 'oslo') {
				await user.keyboard(char);
				await advance(SEARCH_DEBOUNCE_MS - 1);
			}

			expect(apiRequests()).toEqual([]);
			await advance(1);

			expect(await findLink('Nav Alna')).toBeInTheDocument();
			expect(apiRequests()).toEqual(['search/name?query=oslo']);
		});
	});

	describe('adresseforslag', () => {
		test.each([
			{ name: 'postnummer med gatenavn', query: '4737 storgata 1', encoded: '4737%20storgata%201' },
			{ name: 'adresse med punktum', query: 'ole b. bergers veg', encoded: 'ole%20b.%20bergers%20veg' },
		])('sender $name videre til adressesøket', async ({ query, encoded }) => {
			mockAddressSuggestions(query, storgataAdresser(1));
			await searchFor(query);

			expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			expect(screen.queryByText('Søket inneholder ugyldige tegn')).not.toBeInTheDocument();
			expect(apiRequests()).toEqual([`search/name?query=${encoded}`, `search/address?query=${encoded}`]);
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

		test('fjerner gamle søkeresultater og viser lasting ved nytt adressesøk', async () => {
			mockApi('search/name', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const nameSearch = Promise.withResolvers<Reply>();
			const addressSearch = Promise.withResolvers<Reply>();
			mockApi('search/name', nameSearch.promise);
			mockApi('search/address', addressSearch.promise);
			await replaceQuery('ukjent adresse 1');
			await waitForDebounce();

			expect(apiRequests()).toContain('search/name?query=ukjent%20adresse%201');
			expect(getLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(queryLoadingIndicators()).toHaveLength(0);

			nameSearch.resolve({ json: nameResult('ukjent adresse 1') });

			const loadingOption = await screen.findByRole('option', { name: 'Søker...' });
			expect(loadingOption).toHaveAttribute('aria-disabled', 'true');
			expect(getSearchInput()).toHaveAttribute('aria-expanded', 'true');
			expect(getSearchInput()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();

			addressSearch.resolve({ json: addressResult('ukjent adresse 1', []) });

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

			const nameSearch = Promise.withResolvers<Reply>();
			mockApi('search/name', nameSearch.promise);
			mockApi('search/address', pending);
			await replaceQuery('storgata 2');
			await waitForDebounce();
			nameSearch.resolve({ json: nameResult('storgata 2') });

			await waitFor(() => {
				expect(screen.getByRole('listbox')).toHaveStyle({ height: '240px' });
			});
			expect(screen.getByRole('option', { name: 'Søker...' })).toBeInTheDocument();
		});

		test('fjerner gamle søkeresultater uten lasting ved nytt vanlig søk', async () => {
			mockApi('search/name', { json: evjeNameResult });
			await searchFor('evje og hornnes');
			expect(await findLink('Nav Evje og Hornnes')).toBeInTheDocument();

			const nameSearch = Promise.withResolvers<Reply>();
			mockApi('search/name', nameSearch.promise);
			await replaceQuery('kristiansand');
			await waitForDebounce();

			expect(apiRequests()).toContain('search/name?query=kristiansand');
			expect(getLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(queryLoadingIndicators()).toHaveLength(0);

			nameSearch.resolve({
				json: nameResult('kristiansand', [nameHit('KRISTIANSAND', [offices.kristiansand])]),
			});

			expect(await findLink('Nav Kristiansand')).toBeInTheDocument();
			expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
		});
	});

	describe('tastatur og mus i adresseforslag', () => {
		test('kan navigere adresseforslag med piltaster og velge med enter', async () => {
			const scrollIntoView = stubScrollIntoView();
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			mockApi('geoid', { json: geoidResult('030102', offices.frogner) });
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
			expect(await findLink('Nav Frogner')).toBeInTheDocument();
			expectSingleHitFor('Storgata 2, 0184 OSLO');
			expect(getLiveRegion()).toHaveTextContent(/^Adresse valgt: Storgata 2, 0184 OSLO$/);
			await waitForDebounce();
			expect(apiRequests()).toEqual([
				'search/name?query=storgata%201',
				'search/address?query=storgata%201',
				'geoid?id=030102',
			]);
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
			mockApi('geoid', { json: geoidResult('030102', offices.frogner) });
			await typeQuery('storgata 1');
			const input = getSearchInput();

			const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			expect(input).not.toHaveAttribute('aria-activedescendant');
			expect(option).toHaveAttribute('aria-selected', 'false');

			await user.keyboard('{Enter}');

			expect(input).toHaveValue('Storgata 1, 0184 OSLO');
			expect(await findLink('Nav Frogner')).toBeInTheDocument();
			expectSingleHitFor('Storgata 1, 0184 OSLO');
		});

		test('enter velger ikke utdatert eneste adresseforslag når input er endret', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(1));
			mockApi('geoid', { json: geoidResult('030102', offices.frogner) });
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			// Still showing the suggestion for "storgata 1" while the new query waits for the debounce
			await user.keyboard('2');
			expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			await user.keyboard('{Enter}');

			expect(getSearchInput()).toHaveValue('storgata 12');
			expect(apiRequests()).not.toContain('geoid?id=030102');
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
			mockApi('geoid', { json: geoidResult('030102', offices.frogner) });
			await typeQuery('storgata 1');

			await user.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));

			expect(getSearchInput()).toHaveValue('Storgata 1, 0184 OSLO');
			expect(getSearchInput()).toHaveFocus();
			expect(await findLink('Nav Frogner')).toBeInTheDocument();
			expectSingleHitFor('Storgata 1, 0184 OSLO');
		});

		test('tømmer statusmelding når valgt adresse gir serverfeil', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(1));
			mockApi('geoid', { status: 500 });
			await typeQuery('storgata 1');

			await user.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));

			expect(await screen.findByText('Ukjent server-feil')).toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();
		});

		test('slår opp valgt adresse med kommunenummer når bydelsnummer mangler', async () => {
			mockAddressSuggestions('tamburveien 1a', [
				adresse({
					adressenavn: 'Tamburveien',
					husnummer: 1,
					husbokstav: 'A',
					postnummer: '1406',
					poststed: 'SKI',
					kommunenummer: '3218',
					bydelsnummer: null,
				}),
			]);
			mockApi('geoid', { json: geoidResult('3218', offices.nordreFollo) });
			await typeQuery('tamburveien 1a');

			await user.click(await screen.findByRole('option', { name: 'Tamburveien 1A, 1406 SKI' }));

			expect(await findLink('Nav Nordre Follo')).toBeInTheDocument();
			expectSingleHitFor('Tamburveien 1A, 1406 SKI');
			expect(apiRequests()).toEqual([
				'search/name?query=tamburveien%201a',
				'search/address?query=tamburveien%201a',
				'geoid?id=3218',
			]);
		});

		test('ignorerer avbrutt adresseoppslag når brukeren skriver videre', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(1));
			const geoid = Promise.withResolvers<Reply>();
			mockApi('geoid', geoid.promise);
			await typeQuery('storgata 1');
			await user.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));
			await waitFor(() => expect(apiRequests()).toContain('geoid?id=030102'));

			await user.keyboard(' x');

			// Without the guard, the aborted lookup shows "Ukjent server-feil" until the next search starts
			expect(wasAborted('geoid?id=030102')).toBe(true);
			expect(screen.queryByText('Ukjent server-feil')).not.toBeInTheDocument();
			await waitForDebounce();
			expect(screen.queryByText('Ukjent server-feil')).not.toBeInTheDocument();
			geoid.resolve({ json: geoidResult('030102', offices.frogner) });
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

		test.each([
			{ name: 'escape', close: () => user.keyboard('{Escape}'), keepsFocus: true },
			{ name: 'tab', close: () => user.tab(), keepsFocus: false },
		])('$name lukker lasting av adresseforslag og ignorerer sent svar', async ({ close, keepsFocus }) => {
			const addressSearch = Promise.withResolvers<Reply>();
			mockApi('search/name', { json: nameResult('ukjent adresse 1') });
			mockApi('search/address', addressSearch.promise);
			await typeQuery('ukjent adresse 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Søker...' });

			await close();

			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(wasAborted('search/address?query=ukjent%20adresse%201')).toBe(true);
			if (keepsFocus) {
				expect(input).toHaveFocus();
			} else {
				expect(input).not.toHaveFocus();
			}

			addressSearch.resolve({ json: addressResult('ukjent adresse 1', storgataAdresser(2)) });
			await act(() => vi.runOnlyPendingTimersAsync());

			expect(input).toHaveValue('ukjent adresse 1');
			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();
			await refocusSearchInput();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
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
			'https://www.nav.no/person/personopplysninger/nb/#ditt-nav-kontor',
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
		},
		en: {
			label: 'Enter address, post code or town/city',
			login: 'Log in to see your Nav office',
			postnrNone: 'No Nav office found for 4737 HORNNES',
			validation: 'Invalid characters in search',
			suggestions: '2 address suggestions available. Use the arrow keys to choose.',
		},
	} satisfies Partial<Record<AppLocale, Record<string, string>>>;

	test.each(['nn', 'en'] as const)('viser tekster og resultater på %s', async (locale) => {
		const t = texts[locale];
		mockApi('search', { json: postnrResult({ officeInfo: [] }) });
		mockAddressSuggestions('storgata 1', storgataAdresser(2));
		await renderOfficeSearch(locale);

		const input = screen.getByRole('combobox', { name: t.label });
		expect(screen.getByRole('button', { name: t.login })).toHaveAttribute(
			'href',
			`https://www.nav.no/person/personopplysninger/${locale}/#ditt-nav-kontor`,
		);

		await user.type(input, '@');
		expect(screen.getByText(t.validation)).toBeInTheDocument();

		await user.clear(input);
		await user.type(input, '4737');
		await user.keyboard('{Enter}');
		await waitForDebounce();
		expect(await findByFullText(t.postnrNone)).toBeInTheDocument();

		await user.clear(input);
		await typeQuery('storgata 1');
		await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
		expect(getLiveRegion()).toHaveTextContent(new RegExp(`^${escapeRegExp(t.suggestions)}$`));

		// Aksel's own strings don't follow the page locale yet (no Aksel <Provider locale>)
		expect(screen.getByRole('button', { name: 'Tøm feltet' })).toBeInTheDocument();
	});
});

/** A reply that never arrives */
const pending = new Promise<Reply>(() => undefined);

const evjeNameResult = nameResult('evje og hornnes', [nameHit('EVJE OG HORNNES', [offices.evjeOgHornnes])]);

const mockAddressSuggestions = (query: string, adresser: ReturnType<typeof storgataAdresser>, totalHits?: number) => {
	mockApi('search/name', { json: nameResult(query) });
	mockApi('search/address', { json: addressResult(query, adresser, totalHits) });
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
