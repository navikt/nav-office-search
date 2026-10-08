import { act, screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { PostnrKategori } from '../../../common/types/data';
import type { AppLocale } from '../../../common/localization/types';
import { OfficeSearch } from '../components/OfficeSearch';
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
		test('gir feilmelding ved server-feil', async () => {
			mockApi('search', { status: 500 });
			await searchFor('0000');

			expect(await screen.findByText('Ukjent server-feil')).toBeInTheDocument();
			expect(apiRequests()).toEqual(['search?query=0000']);
		});

		test('gir feilmelding ved søk på postnummer som ikke finnes', async () => {
			mockApi('search', { status: 404, json: errorResult('errorInvalidPostnr') });
			await searchFor('0000');

			expect(await screen.findByText('Postnummeret finnes ikke')).toBeInTheDocument();
		});

		test('gir valideringsfeil ved tomt input-felt', async () => {
			await searchFor('');

			expect(screen.getByText('Skriv inn minst to bokstaver eller et postnummer')).toBeInTheDocument();
			expect(apiRequests()).toEqual([]);
		});

		test('gir valideringsfeil ved feil antall siffer', async () => {
			await searchFor('11');

			expect(screen.getByText('Postnummer-søk må være fire siffer')).toBeInTheDocument();
			expect(apiRequests()).toEqual([]);
		});

		test('gir valideringsfeil ved ugyldige tegn', async () => {
			await searchFor('evje@');

			expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();
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
		test('gir riktig respons ved søk på postnr uten kontorer', async () => {
			mockApi('search', { json: postnrResult({ officeInfo: [] }) });
			await searchFor('4737');

			expect(await findByFullText('Ingen Nav-kontor funnet for 4737 HORNNES')).toBeInTheDocument();
			expect(screen.queryAllByRole('link', { name: /^Nav / })).toHaveLength(0);
			expect(apiRequests()).toEqual(['search?query=4737']);
		});

		test('gir riktig respons ved søk på postnr med ett kontor', async () => {
			mockApi('search', { json: postnrResult() });
			await searchFor('4737');

			expect(await findByFullText('Nav-kontor for 4737 HORNNES:')).toBeInTheDocument();
			expect(getLink('Nav Evje og Hornnes')).toHaveAttribute('href', offices.evjeOgHornnes.url);
			expect(apiRequests()).toEqual(['search?query=4737']);
		});

		test('gir riktig respons ved søk på postnr med flere kontor', async () => {
			mockApi('search', { json: postnrResult({ officeInfo: [offices.evjeOgHornnes, offices.testkontor] }) });
			await searchFor('4737');

			expect(await findByFullText('2 kontorer dekker 4737 HORNNES')).toBeInTheDocument();
			expect(getLink('Nav Evje og Hornnes')).toBeInTheDocument();
			expect(getLink('Nav Testkontor')).toBeInTheDocument();
		});

		test('bruker adressesøk for postnummer med gatenavn', async () => {
			mockAddressSuggestions('4737 storgata 1', storgataAdresser(1));
			await typeQuery('4737 storgata 1');

			expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			expect(apiRequests()).toEqual([
				'search/name?query=4737%20storgata%201',
				'search/address?query=4737%20storgata%201',
			]);
		});

		test('gir riktig respons ved søk på postnummer for postbokser', async () => {
			mockApi('search', { json: osloPostnrResult('0614', PostnrKategori.Postbokser) });
			await searchFor('0614');

			expect(
				await findByFullText('0614 er et postnummer for postbokser i OSLO kommune. Kommunens Nav-kontorer:'),
			).toBeInTheDocument();
			expect(getLink('Nav Alna')).toBeInTheDocument();
			expect(getLink('Nav Bjerke')).toBeInTheDocument();
			expect(getLink('Nav Frogner')).toBeInTheDocument();
		});

		test('gir riktig respons ved søk på servicepostnummer', async () => {
			mockApi('search', { json: osloPostnrResult('0614', PostnrKategori.Servicepostnummer) });
			await searchFor('0614');

			expect(
				await findByFullText('0614 er et servicepostnummer i OSLO kommune. Kommunens Nav-kontorer:'),
			).toBeInTheDocument();
			expect(getLink('Nav Alna')).toBeInTheDocument();
			expect(getLink('Nav Bjerke')).toBeInTheDocument();
			expect(getLink('Nav Frogner')).toBeInTheDocument();
		});

		test('gir riktig respons ved søk på postnummer som dekkes av flere bydeler', async () => {
			mockApi('search', { json: osloPostnrResult('0354', PostnrKategori.Gateadresser) });
			await searchFor('0354');

			expect(await findByFullText('3 kontorer dekker 0354 OSLO')).toBeInTheDocument();
			expect(getLink('Nav Alna')).toBeInTheDocument();
			expect(getLink('Nav Bjerke')).toBeInTheDocument();
			expect(getLink('Nav Frogner')).toBeInTheDocument();
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
		test('tillater punktum i adressesøk og sender det videre', async () => {
			const query = 'ole b. bergers veg';
			mockAddressSuggestions(query, storgataAdresser(1));
			await searchFor(query);

			expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			expect(screen.queryByText('Søket inneholder ugyldige tegn')).not.toBeInTheDocument();
			expect(apiRequests()).toEqual([
				'search/name?query=ole%20b.%20bergers%20veg',
				'search/address?query=ole%20b.%20bergers%20veg',
			]);
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

		test('gir riktig respons ved adressesøk med treff', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await searchFor('storgata 1');

			expect(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
			expect(getHighlightedAddressParts('Storgata 1, 0184 OSLO')).toEqual(['Storgata', '1', '1']);
		});

		test('beholder mellomrom rundt uthevet ord i adresseforslag', async () => {
			mockAddressSuggestions('Storgata', storgataAdresser(2));
			await searchFor('Storgata');

			const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
			expect(option).toHaveTextContent(/^Storgata 1, 0184 OSLO$/);
			expect(option.querySelector('span')).toHaveTextContent(/^Storgata 1, 0184 OSLO$/);
			expect(option.querySelector('strong')).toHaveTextContent(/^Storgata$/);
		});

		test('uthever ikke ord som bare matcher fuzzy', async () => {
			mockAddressSuggestions('bull aakrans 5', [
				adresse({
					adressenavn: 'Bull Aakranns vei',
					husnummer: 5,
					postnummer: '7374',
					poststed: 'RØROS',
					kommunenummer: '5025',
					bydelsnummer: null,
				}),
			]);
			await searchFor('bull aakrans 5');

			await screen.findByRole('option', { name: 'Bull Aakranns vei 5, 7374 RØROS' });
			expect(getHighlightedAddressParts('Bull Aakranns vei 5, 7374 RØROS')).toEqual(['Bull', '5']);
		});

		test('foretrekker lengre treff foran kortere overlappende treff i adresseforslag', async () => {
			mockAddressSuggestions('ole b berger', [
				adresse({
					adressenavn: 'Ole B. Bergers veg',
					husnummer: 5,
					postnummer: '3520',
					poststed: 'JEVNAKER',
					kommunenummer: '3236',
					bydelsnummer: null,
				}),
			]);
			await searchFor('ole b berger');

			await screen.findByRole('option', { name: 'Ole B. Bergers veg 5, 3520 JEVNAKER' });
			expect(getHighlightedAddressParts('Ole B. Bergers veg 5, 3520 JEVNAKER')).toEqual(['Ole', 'B', 'Berger']);
		});

		test('viser avgrensningshint når adresseforslagene har flere treff enn synlige rader', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(10), 30);
			await searchFor('storgata 1');

			const hint = await screen.findByText(
				'Viser 10 av 30 adresseforslag. Skriv mer av adressen for å avgrense søket.',
			);
			expect(screen.getByRole('listbox')).not.toContainElement(hint);
			expect(getLiveRegion()).toHaveTextContent(
				/^10 adresseforslag tilgjengelig\. Bruk piltastene for å velge\. Viser 10 av 30 adresseforslag\. Skriv mer av adressen for å avgrense søket\.$/,
			);
		});

		test('viser avgrensningshint når alle adresseforslag vises, men det er flere enn synlige rader', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(10));
			await searchFor('storgata 1');

			expect(
				await screen.findByText('Viser 10 av 10 adresseforslag. Skriv mer av adressen for å avgrense søket.'),
			).toBeInTheDocument();
		});

		test('skjuler avgrensningshint når alle adresseforslag får plass i synlige rader', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(6));
			await searchFor('storgata 1');

			expect(await screen.findByRole('option', { name: 'Storgata 6, 0184 OSLO' })).toBeInTheDocument();
			expect(screen.queryByText(/^Viser \d+ av \d+ adresseforslag/)).not.toBeInTheDocument();
			expect(getLiveRegion()).toHaveTextContent(/^6 adresseforslag tilgjengelig\. Bruk piltastene for å velge\.$/);
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
		test('lukker adresseforslag med escape uten å tømme inputfeltet', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			await user.keyboard('{Escape}');

			expect(input).toHaveValue('storgata 1');
			expect(input).toHaveFocus();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

			await refocusSearchInput();
			expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
		});

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

		test('lukker adresseforslag med tab uten å fange fokus og åpner igjen på fokus', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			await user.tab();

			expect(getSearchInput()).not.toHaveFocus();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

			await refocusSearchInput();
			expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
		});

		test('lukker adresseforslag ved blur og åpner igjen på fokus', async () => {
			mockAddressSuggestions('storgata 1', storgataAdresser(2));
			await typeQuery('storgata 1');
			await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

			await user.click(document.body);

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

			await user.click(getSearchInput());
			expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
		});

		test('lukker tom adresseforslagsliste med escape', async () => {
			mockAddressSuggestions('ukjent adresse 1', []);
			await typeQuery('ukjent adresse 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' });

			await user.keyboard('{Escape}');

			expect(input).toHaveValue('ukjent adresse 1');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

			await refocusSearchInput();
			expect(screen.getByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' })).toBeInTheDocument();
		});

		test('lukker lasting av adresseforslag med escape og ignorerer sent svar', async () => {
			const addressSearch = Promise.withResolvers<Reply>();
			mockApi('search/name', { json: nameResult('ukjent adresse 1') });
			mockApi('search/address', addressSearch.promise);
			await typeQuery('ukjent adresse 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Søker...' });

			await user.keyboard('{Escape}');

			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(wasAborted('search/address?query=ukjent%20adresse%201')).toBe(true);

			addressSearch.resolve({ json: addressResult('ukjent adresse 1', storgataAdresser(2)) });
			await act(() => vi.runOnlyPendingTimersAsync());

			expect(input).toHaveValue('ukjent adresse 1');
			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(getLiveRegion()).toBeEmptyDOMElement();
			await refocusSearchInput();
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		test('lukker lasting av adresseforslag med tab uten å fange fokus', async () => {
			mockApi('search/name', { json: nameResult('ukjent adresse 1') });
			mockApi('search/address', pending);
			await typeQuery('ukjent adresse 1');
			const input = getSearchInput();
			await screen.findByRole('option', { name: 'Søker...' });

			await user.tab();

			expect(input).not.toHaveFocus();
			expect(input).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			expect(wasAborted('search/address?query=ukjent%20adresse%201')).toBe(true);
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
