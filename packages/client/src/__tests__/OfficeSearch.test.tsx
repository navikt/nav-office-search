import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { OfficeSearch } from '../components/OfficeSearch';
import fetch, { enableFetchMocks } from 'jest-fetch-mock';
import * as errorInvalidPostnr from './testdata/error-invalid-postnr.json';
import * as postnrResultNone from './testdata/postnr-result-none.json';
import * as postnrResultOne from './testdata/postnr-result-one.json';
import * as postnrResultMany from './testdata/postnr-result-many.json';
import * as postnrResultPostbox from './testdata/postnr-result-postbox.json';
import * as postnrResultServicebox from './testdata/postnr-result-servicebox.json';
import * as postnrResultBydel from './testdata/postnr-result-bydel.json';
import * as stedsnavnResultWithHits from './testdata/stedsnavn-result-with-hits.json';
import * as stedsnavnResultWithoutHits from './testdata/stedsnavn-result-without-hits.json';

jest.mock('../urls', () => ({
    clientUrls: {
        searchApi: '/api/search',
        searchNameApi: '/api/search/name',
        searchAddressApi: '/api/search/address',
        geoidApi: '/api/geoid',
    },
}));

jest.mock('lodash.debounce', () => ({
    __esModule: true,
    default: jest.fn((fn) => fn),
}));

enableFetchMocks();

describe('OfficeSearch', () => {
    beforeEach(() => {
        fetch.resetMocks();
        render(<OfficeSearch />);
    });

    test('gir feilmelding ved server-feil', async () => {
        fetch.mockResponse('', { status: 500 });
        searchForText('0000');
        await waitFor(() => {
            expect(screen.getByText('Ukjent server-feil')).toBeInTheDocument();
        });
    });

    test('gir feilmelding ved søk på postnummer som ikke finnes', async () => {
        fetch.mockResponse(JSON.stringify(errorInvalidPostnr), { status: 404 });
        searchForText('0000');
        await waitFor(() => {
            expect(screen.getByText('Postnummeret finnes ikke')).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved tomt input-felt', async () => {
        searchForText('');
        await waitFor(() => {
            expect(
                screen.getByText('Skriv inn minst to bokstaver eller et postnummer')
            ).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved feil antall siffer', async () => {
        searchForText('11');
        await waitFor(() => {
            expect(screen.getByText('Postnummer-søk må være fire siffer')).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved ugyldige tegn', async () => {
        searchForText('evje@');
        await waitFor(() => {
            expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    test('viser valideringsfeil for ugyldige tegn mens brukeren skriver', async () => {
        inputSearchText('@');

        expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('fjerner gamle søkeresultater når input blir for kort', async () => {
        fetch.mockResponse(JSON.stringify(stedsnavnResultWithHits));
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });

        inputSearchText('e');

        expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();
    });

    test('gir riktig respons ved søk på postnr uten kontorer', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultNone));
        searchForText('4737');
        await waitFor(() => {
            expect(screen.getByText('Ingen Nav-kontor funnet for')).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnr med ett kontor', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultOne));
        searchForText('4737');
        await waitFor(() => {
            expect(screen.getByText('Nav-kontor for', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnr med flere kontor', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultMany));
        searchForText('4737');
        await waitFor(() => {
            expect(screen.getByText('2 kontorer dekker', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
            expect(getLinkByName('Nav Testkontor')).toBeInTheDocument();
        });
    });

    test('bruker adressesøk for postnummer med gatenavn', async () => {
        mockAddressSuggestionSearch(undefined, 1, '4737 storgata 1');
        searchForText('4737 storgata 1');

        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })
            ).toBeInTheDocument();
        });
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/search/name?query=4737%20storgata%201'),
            expect.anything()
        );
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/search/address?query=4737%20storgata%201'),
            expect.anything()
        );
        expect(fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/search?query=4737%20storgata%201'),
            expect.anything()
        );
    });

    test('tillater punktum i adressesøk og sender det videre', async () => {
        const query = 'ole b. bergers veg';
        const encodedQuery = encodeURIComponent(query);
        mockAddressSuggestionSearch(undefined, 1, query);

        searchForText(query);

        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })
            ).toBeInTheDocument();
        });
        expect(screen.queryByText('Søket inneholder ugyldige tegn')).not.toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/search/name?query=${encodedQuery}`),
            expect.anything()
        );
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/search/address?query=${encodedQuery}`),
            expect.anything()
        );
    });

    test('gir riktig respons ved søk på postnummer for postbokser', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultPostbox));
        searchForText('0614');
        await waitFor(() => {
            expect(
                screen.getByText('0614 er et postnummer for postbokser i', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(screen.getByText('OSLO')).toBeInTheDocument();
            expect(
                screen.getByText('kommune. Kommunens Nav-kontorer:', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Alna')).toBeInTheDocument();
            expect(getLinkByName('Nav Bjerke')).toBeInTheDocument();
            expect(getLinkByName('Nav Frogner')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på servicepostnummer', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultServicebox));
        searchForText('0614');
        await waitFor(() => {
            expect(
                screen.getByText('0614 er et servicepostnummer i', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(screen.getByText('OSLO')).toBeInTheDocument();
            expect(
                screen.getByText('kommune. Kommunens Nav-kontorer:', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Alna')).toBeInTheDocument();
            expect(getLinkByName('Nav Bjerke')).toBeInTheDocument();
            expect(getLinkByName('Nav Frogner')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnummer uten spesifikt tilknyttet kontor', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultBydel));
        searchForText('0354');
        await waitFor(() => {
            expect(
                screen.getByText('Fant ingen kontor spesifikt tilknyttet', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(screen.getByText('0354')).toBeInTheDocument();
            expect(
                screen.getByText('Alle kommunens Nav-kontorer:', {
                    exact: false,
                })
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Alna')).toBeInTheDocument();
            expect(getLinkByName('Nav Bjerke')).toBeInTheDocument();
            expect(getLinkByName('Nav Frogner')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på stedsnavn med søketreff', async () => {
        fetch.mockResponse(JSON.stringify(stedsnavnResultWithHits));
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(screen.getByText('Søkeresultat for "evje og hornnes" (1):')).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
        expect(fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/search/address'),
            expect.anything()
        );
    });

    test('gir serverfeil og hopper over adressefallback når stedsnavnsøk feiler', async () => {
        fetch.mockResponse('', { status: 500 });
        searchForText('evje og hornnes');

        await waitFor(() => {
            expect(screen.getByText('Ukjent server-feil')).toBeInTheDocument();
        });
        expect(fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/search/address'),
            expect.anything()
        );
    });

    test('gir riktig respons ved søk på stedsnavn uten søketreff', async () => {
        fetch.mockResponses(
            [JSON.stringify(stedsnavnResultWithoutHits), { status: 200 }],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'evje og hornnes',
                    sokAdresse: { hits: [], totalHits: 0 },
                }),
                { status: 200 },
            ]
        );
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Ingen resultater for "evje og hornnes"' })
            ).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved adressesøk uten søketreff', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'ukjent adresse 1',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'ukjent adresse 1',
                    sokAdresse: { hits: [], totalHits: 0 },
                }),
                { status: 200 },
            ]
        );
        searchForText('ukjent adresse 1');
        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' })
            ).toBeInTheDocument();
        });
        expect(
            screen.getByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' })
        ).toHaveAttribute('aria-disabled', 'true');
        expect(getSearchInput()).toHaveAttribute('aria-expanded', 'true');
        expect(getSearchInput()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        expect(getSearchInput()).toHaveAttribute('autocomplete', 'off');
        expect(getSearchInput()).toHaveAttribute('autocorrect', 'off');
        expect(getSearchInput()).toHaveAttribute('autocapitalize', 'none');
        expect(getSearchInput()).toHaveAttribute('spellcheck', 'false');
    });

    test('gir riktig respons ved adressesøk med treff', async () => {
        mockAddressSuggestionSearch();
        searchForText('storgata 1');
        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })
            ).toBeInTheDocument();
        });
        expect(getHighlightedAddressParts('Storgata 1, 0184 OSLO')).toEqual(['Storgata', '1', '1']);
    });

    test('beholder mellomrom rundt uthevet ord i adresseforslag', async () => {
        mockAddressSuggestionSearch(undefined, 2, 'Storgata');
        searchForText('Storgata');

        const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

        expect(option).toHaveTextContent('Storgata 1, 0184 OSLO');
        expect(option.querySelector('span')).toHaveTextContent('Storgata 1, 0184 OSLO');
        expect(option.querySelector('strong')).toHaveTextContent('Storgata');
    });

    test('uthever ikke ord som bare matcher fuzzy', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'bull aakrans 5',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'bull aakrans 5',
                    sokAdresse: {
                        totalHits: 1,
                        hits: [
                            {
                                vegadresse: {
                                    adressenavn: 'Bull Aakranns vei',
                                    husnummer: 5,
                                    husbokstav: null,
                                    postnummer: '7374',
                                    poststed: 'RØROS',
                                    kommunenummer: '5025',
                                    bydelsnummer: null,
                                },
                            },
                        ],
                    },
                }),
                { status: 200 },
            ]
        );
        searchForText('bull aakrans 5');

        await screen.findByRole('option', { name: 'Bull Aakranns vei 5, 7374 RØROS' });

        expect(getHighlightedAddressParts('Bull Aakranns vei 5, 7374 RØROS')).toEqual([
            'Bull',
            '5',
        ]);
    });

    test('foretrekker lengre treff foran kortere overlappende treff i adresseforslag', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'ole b berger',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'ole b berger',
                    sokAdresse: {
                        totalHits: 1,
                        hits: [
                            {
                                vegadresse: {
                                    adressenavn: 'Ole B. Bergers veg',
                                    husnummer: 5,
                                    husbokstav: null,
                                    postnummer: '3520',
                                    poststed: 'JEVNAKER',
                                    kommunenummer: '3236',
                                    bydelsnummer: null,
                                },
                            },
                        ],
                    },
                }),
                { status: 200 },
            ]
        );
        searchForText('ole b berger');

        await screen.findByRole('option', { name: 'Ole B. Bergers veg 5, 3520 JEVNAKER' });

        expect(getHighlightedAddressParts('Ole B. Bergers veg 5, 3520 JEVNAKER')).toEqual([
            'Ole',
            'B',
            'Berger',
        ]);
    });

    test('viser avgrensningshint når adresseforslagene har flere treff enn synlige rader', async () => {
        mockAddressSuggestionSearch(undefined, 10, 'storgata 1', 30);
        searchForText('storgata 1');

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Viser 10 av 30 treff. Skriv mer av adressen for å avgrense søket.'
                )
            ).toBeInTheDocument();
        });
        expect(screen.getByRole('listbox')).not.toContainElement(
            screen.getByText('Viser 10 av 30 treff. Skriv mer av adressen for å avgrense søket.')
        );
        expect(getLiveRegion()).toHaveTextContent(
            '10 adresseforslag tilgjengelig. Bruk piltastene for å velge. Viser 10 av 30 treff. Skriv mer av adressen for å avgrense søket.'
        );
    });

    test('viser avgrensningshint når alle adresseforslag vises, men det er flere enn synlige rader', async () => {
        mockAddressSuggestionSearch(undefined, 10, 'storgata 1', 10);
        searchForText('storgata 1');

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Viser 10 av 10 treff. Skriv mer av adressen for å avgrense søket.'
                )
            ).toBeInTheDocument();
        });
    });

    test('skjuler avgrensningshint når alle adresseforslag får plass i synlige rader', async () => {
        mockAddressSuggestionSearch(undefined, 6, 'storgata 1', 6);
        searchForText('storgata 1');

        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Storgata 6, 0184 OSLO' })
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText('Viser 6 av 6 treff. Skriv mer av adressen for å avgrense søket.')
        ).not.toBeInTheDocument();
        expect(getLiveRegion()).toHaveTextContent(
            '6 adresseforslag tilgjengelig. Bruk piltastene for å velge.'
        );
    });

    test('kan navigere adresseforslag med piltaster og velge med enter', async () => {
        const scrollIntoView = jest.fn();
        window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
        mockAddressSuggestionSearch(JSON.stringify(postnrResultOne));
        inputSearchText('storgata 1');
        const input = getSearchInput();

        const firstOption = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        const secondOption = screen.getByRole('option', { name: 'Storgata 2, 0184 OSLO' });

        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(firstOption).toHaveAttribute('aria-selected', 'true');
        expect(input).toHaveAttribute('aria-activedescendant', firstOption.id);
        await waitFor(() => {
            expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        });

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(secondOption).toHaveAttribute('aria-selected', 'true');
        expect(input).toHaveAttribute('aria-activedescendant', secondOption.id);

        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(input).toHaveValue('Storgata 2, 0184 OSLO');
            expect(
                screen.getByText('Søkeresultat for "Storgata 2, 0184 OSLO" (1):')
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('enter uten aktivt adresseforslag starter ikke søket på nytt', async () => {
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        expect(fetch).toHaveBeenCalledTimes(2);

        fireEvent.keyDown(input, { key: 'Enter' });

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    test('enter velger eneste adresseforslag uten piltastnavigering', async () => {
        mockAddressSuggestionSearch(JSON.stringify(postnrResultOne), 1);
        inputSearchText('storgata 1');
        const input = getSearchInput();

        const option = await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(option).toHaveAttribute('aria-selected', 'false');

        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(input).toHaveValue('Storgata 1, 0184 OSLO');
            expect(
                screen.getByText('Søkeresultat for "Storgata 1, 0184 OSLO" (1):')
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('enter velger ikke utdatert eneste adresseforslag når input er endret', async () => {
        mockAddressSuggestionSearch(JSON.stringify(postnrResultOne), 1);
        inputSearchText('storgata 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });

        inputSearchText('storgata 1@');
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(input).toHaveValue('storgata 1@');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(
            screen.queryByText('Søkeresultat for "Storgata 1, 0184 OSLO" (1):')
        ).not.toBeInTheDocument();
    });

    test('musepeker over adresseforslag trigger ikke automatisk scrolling', async () => {
        const scrollIntoView = jest.fn();
        window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');

        const secondOption = await screen.findByRole('option', { name: 'Storgata 2, 0184 OSLO' });
        fireEvent.mouseEnter(secondOption);

        expect(secondOption).toHaveAttribute('aria-selected', 'true');
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    test('lukker adresseforslag med escape uten å tømme inputfeltet', async () => {
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(input).toHaveValue('storgata 1');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        fireEvent.focus(input);
        expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
    });

    test('lukker adresseforslag med tab uten å fange fokus og åpner igjen på fokus', async () => {
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        fireEvent.keyDown(input, { key: 'Tab' });

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        fireEvent.focus(input);
        expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
    });

    test('lukker adresseforslag ved blur og åpner igjen på fokus', async () => {
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' });
        fireEvent.blur(input, { relatedTarget: null });

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        fireEvent.focus(input);
        expect(screen.getByRole('option', { name: 'Storgata 1, 0184 OSLO' })).toBeInTheDocument();
    });

    test('lukker tom adresseforslagsliste med escape', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'ukjent adresse 1',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'ukjent adresse 1',
                    sokAdresse: { hits: [], totalHits: 0 },
                }),
                { status: 200 },
            ]
        );
        inputSearchText('ukjent adresse 1');
        const input = getSearchInput();

        await screen.findByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' });
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(input).toHaveValue('ukjent adresse 1');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        fireEvent.focus(input);
        expect(
            screen.getByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' })
        ).toBeInTheDocument();
    });

    test('lukker lasting av adresseforslag med escape og ignorerer sent svar', async () => {
        let resolveNameSearch: (body: string) => void = () => undefined;
        let resolveAddressSearch: (body: string) => void = () => undefined;
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveNameSearch = resolve;
                })
        );
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveAddressSearch = resolve;
                })
        );
        inputSearchText('ukjent adresse 1');
        const input = getSearchInput();

        resolveNameSearch(
            JSON.stringify({
                hits: [],
                type: 'name',
                input: 'ukjent adresse 1',
            })
        );

        await screen.findByRole('option', { name: 'Søker...' });
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        resolveAddressSearch(
            JSON.stringify({
                type: 'adresse',
                adresseQuery: 'ukjent adresse 1',
                sokAdresse: { hits: [], totalHits: 0 },
            })
        );

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
    });

    test('lukker lasting av adresseforslag med tab uten å fange fokus', async () => {
        let resolveNameSearch: (body: string) => void = () => undefined;
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveNameSearch = resolve;
                })
        );
        fetch.mockResponseOnce(() => new Promise<string>(() => undefined));
        inputSearchText('ukjent adresse 1');
        const input = getSearchInput();

        resolveNameSearch(
            JSON.stringify({
                hits: [],
                type: 'name',
                input: 'ukjent adresse 1',
            })
        );

        await screen.findByRole('option', { name: 'Søker...' });
        fireEvent.keyDown(input, { key: 'Tab' });

        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('kan velge adresseforslag med mus', async () => {
        mockAddressSuggestionSearch(JSON.stringify(postnrResultOne));
        inputSearchText('storgata 1');

        fireEvent.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));

        await waitFor(() => {
            expect(getSearchInput()).toHaveValue('Storgata 1, 0184 OSLO');
            expect(
                screen.getByText('Søkeresultat for "Storgata 1, 0184 OSLO" (1):')
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('tømmer statusmelding når valgt adresse gir serverfeil', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'storgata 1',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'storgata 1',
                    sokAdresse: {
                        totalHits: 1,
                        hits: [
                            {
                                vegadresse: {
                                    adressenavn: 'Storgata',
                                    husnummer: 1,
                                    husbokstav: null,
                                    postnummer: '0184',
                                    poststed: 'OSLO',
                                    kommunenummer: '0301',
                                    bydelsnummer: '030102',
                                },
                            },
                        ],
                    },
                }),
                { status: 200 },
            ],
            ['', { status: 500 }]
        );
        inputSearchText('storgata 1');

        fireEvent.click(await screen.findByRole('option', { name: 'Storgata 1, 0184 OSLO' }));

        await waitFor(() => {
            expect(screen.getByText('Ukjent server-feil')).toBeInTheDocument();
        });
        expect(getLiveRegion()).toHaveTextContent('');
    });

    test('slår opp valgt adresse med kommunenummer når bydelsnummer mangler', async () => {
        fetch.mockResponses(
            [
                JSON.stringify({
                    hits: [],
                    type: 'name',
                    input: 'tamburveien 1a',
                }),
                { status: 200 },
            ],
            [
                JSON.stringify({
                    type: 'adresse',
                    adresseQuery: 'tamburveien 1a',
                    sokAdresse: {
                        totalHits: 1,
                        hits: [
                            {
                                vegadresse: {
                                    adressenavn: 'Tamburveien',
                                    husnummer: 1,
                                    husbokstav: 'A',
                                    postnummer: '1406',
                                    poststed: 'SKI',
                                    kommunenummer: '3218',
                                    bydelsnummer: null,
                                },
                            },
                        ],
                    },
                }),
                { status: 200 },
            ],
            [JSON.stringify(postnrResultOne), { status: 200 }]
        );
        inputSearchText('tamburveien 1a');

        fireEvent.click(await screen.findByRole('option', { name: 'Tamburveien 1A, 1406 SKI' }));

        await waitFor(() => {
            expect(
                screen.getByText('Søkeresultat for "Tamburveien 1A, 1406 SKI" (1):')
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/geoid?id=3218'),
            expect.anything()
        );
        expect(fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/search?query=1406'),
            expect.anything()
        );
    });

    test('fjerner gamle søkeresultater og viser lasting ved nytt adressesøk', async () => {
        fetch.mockResponse(JSON.stringify(stedsnavnResultWithHits));
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });

        fetch.resetMocks();
        let resolveNameSearch: (body: string) => void = () => undefined;
        let resolveAddressSearch: (body: string) => void = () => undefined;
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveNameSearch = resolve;
                })
        );
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveAddressSearch = resolve;
                })
        );

        inputSearchText('ukjent adresse 1');

        expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        resolveNameSearch(
            JSON.stringify({
                hits: [],
                type: 'name',
                input: 'ukjent adresse 1',
            })
        );

        await waitFor(() => {
            expect(screen.getByRole('option', { name: 'Søker...' })).toHaveAttribute(
                'aria-disabled',
                'true'
            );
        });
        expect(getSearchInput()).toHaveAttribute('aria-expanded', 'true');
        expect(getSearchInput()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        expect(screen.queryByRole('link', { name: 'Nav Evje og Hornnes' })).not.toBeInTheDocument();

        resolveAddressSearch(
            JSON.stringify({
                type: 'adresse',
                adresseQuery: 'ukjent adresse 1',
                sokAdresse: { hits: [], totalHits: 0 },
            })
        );

        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'Ingen resultater for "ukjent adresse 1"' })
            ).toBeInTheDocument();
        });
    });

    test('beholder høyden fra forrige adresseforslag mens nye adresseforslag lastes', async () => {
        mockAddressSuggestionSearch();
        inputSearchText('storgata 1');

        const previousDropdown = (await screen.findByRole('listbox')).parentElement?.parentElement;
        expect(previousDropdown).toBeInstanceOf(HTMLElement);
        jest.spyOn(previousDropdown as HTMLElement, 'getBoundingClientRect').mockReturnValue({
            bottom: 0,
            height: 240,
            left: 0,
            right: 0,
            top: 0,
            width: 480,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        fetch.resetMocks();
        let resolveNameSearch: (body: string) => void = () => undefined;
        fetch.mockResponseOnce(
            () =>
                new Promise<string>((resolve) => {
                    resolveNameSearch = resolve;
                })
        );
        fetch.mockResponseOnce(() => new Promise<string>(() => undefined));

        inputSearchText('storgata 2');

        resolveNameSearch(
            JSON.stringify({
                hits: [],
                type: 'name',
                input: 'storgata 2',
            })
        );

        await waitFor(() => {
            expect(screen.getByRole('listbox')).toHaveStyle({ height: '240px' });
        });
    });

    test('fjerner gamle søkeresultater uten lasting ved nytt vanlig søk', async () => {
        fetch.mockResponse(JSON.stringify(stedsnavnResultWithHits));
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });

        fetch.resetMocks();
        let resolveSearch: (body: string) => void = () => undefined;
        fetch.mockResponse(
            () =>
                new Promise<string>((resolve) => {
                    resolveSearch = resolve;
                })
        );

        inputSearchText('kristiansand');

        expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        resolveSearch(
            JSON.stringify({
                hits: [
                    {
                        name: 'KRISTIANSAND',
                        officeHits: [
                            {
                                name: 'Nav Kristiansand',
                                url: 'https://www.nav.no/kontor/nav-kristiansand',
                                geoId: '4204',
                                enhetNr: '1001',
                                hitString: 'KRISTIANSAND',
                            },
                        ],
                    },
                ],
                type: 'name',
                input: 'kristiansand',
            })
        );

        await waitFor(() => {
            expect(getLinkByName('Nav Kristiansand')).toBeInTheDocument();
        });
    });
});

const getLinkByName = (name: string) => {
    return screen.getByRole('link', { name: name });
};

const getHighlightedAddressParts = (name: string) =>
    Array.from(
        screen.getByRole('option', { name }).querySelectorAll('strong'),
        (element) => element.textContent
    );

const getSearchInput = () =>
    screen.getByRole('combobox', {
        name: 'Skriv inn et postnummer eller stedsnavn:',
    });

const getLiveRegion = () => document.querySelector('.aksel-sr-only') as HTMLElement;

const searchForText = (text: string) => {
    inputSearchText(text);

    fireEvent.click(screen.getByRole('button', { name: 'Søk' }));
};

const inputSearchText = (text: string) => {
    fireEvent.input(getSearchInput(), {
        target: { value: text },
    });
};

const mockAddressSuggestionSearch = (
    geoidResponse?: string,
    suggestionCount = 2,
    addressQuery = 'storgata 1',
    totalHits = suggestionCount
) => {
    const addressHits = Array.from({ length: suggestionCount }, (_, index) => ({
        vegadresse: {
            adressenavn: 'Storgata',
            husnummer: index + 1,
            husbokstav: null,
            postnummer: '0184',
            poststed: 'OSLO',
            kommunenummer: '0301',
            bydelsnummer: '030102',
        },
    }));

    const responses: Parameters<typeof fetch.mockResponses> = [
        [
            JSON.stringify({
                hits: [],
                type: 'name',
                input: addressQuery,
            }),
            { status: 200 },
        ],
        [
            JSON.stringify({
                type: 'adresse',
                adresseQuery: addressQuery,
                sokAdresse: {
                    totalHits,
                    hits: addressHits,
                },
            }),
            { status: 200 },
        ],
    ];

    if (geoidResponse) {
        responses.push([geoidResponse, { status: 200 }]);
    }

    fetch.mockResponses(...responses);
};
