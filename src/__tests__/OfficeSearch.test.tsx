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
    clientUrls: () => [],
}));

jest.mock('lodash.debounce', () => ({
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
            expect(
                screen.getByText('Postnummeret finnes ikke')
            ).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved tomt input-felt', async () => {
        searchForText('');
        await waitFor(() => {
            expect(
                screen.getByText(
                    'Skriv inn minst to bokstaver eller et postnummer'
                )
            ).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved feil antall siffer', async () => {
        searchForText('11');
        await waitFor(() => {
            expect(
                screen.getByText('Postnummer-søk må være fire siffer')
            ).toBeInTheDocument();
        });
    });

    test('gir valideringsfeil ved ugyldige tegn', async () => {
        searchForText('0354,.-');
        await waitFor(() => {
            expect(
                screen.getByText('Søket inneholder ugyldige tegn')
            ).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnr uten kontorer', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultNone));
        searchForText('4737');
        await waitFor(() => {
            expect(
                screen.getByText('Ingen Nav-kontor funnet for')
            ).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnr med ett kontor', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultOne));
        searchForText('4737');
        await waitFor(() => {
            expect(
                screen.getByText('Nav-kontor for', { exact: false })
            ).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på postnr med flere kontor', async () => {
        fetch.mockResponse(JSON.stringify(postnrResultMany));
        searchForText('4737');
        await waitFor(() => {
            expect(
                screen.getByText('2 kontorer dekker', { exact: false })
            ).toBeInTheDocument();
            expect(screen.getByText('4737 HORNNES')).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Du kan legge til gatenavn og husnummer for å spisse søket, f.eks. 4737 Eksempelgata 12',
                    { exact: false }
                )
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
            expect(getLinkByName('Nav Testkontor')).toBeInTheDocument();
        });
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
            expect(
                screen.getByText('Søkeresultat for "evje og hornnes" (1):')
            ).toBeInTheDocument();
            expect(getLinkByName('Nav Evje og Hornnes')).toBeInTheDocument();
        });
    });

    test('gir riktig respons ved søk på stedsnavn uten søketreff', async () => {
        fetch.mockResponse(JSON.stringify(stedsnavnResultWithoutHits));
        searchForText('evje og hornnes');
        await waitFor(() => {
            expect(
                screen.getByText('Ingen resultater for "evje og hornnes"')
            ).toBeInTheDocument();
        });
    });
});

const getLinkByName = (name: string) => {
    return screen.getByRole('link', { name: name });
};

const searchForText = (text: string) => {
    fireEvent.input(
        screen.getByRole('searchbox', {
            name: 'Skriv inn et postnummer eller stedsnavn:',
        }),
        {
            target: { value: text },
        }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Søk' }));
};
