import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
import { act, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDecoratorParams } from '../../../common/decoratorParams';
import { App } from '../App';
import { renderAndSettle } from './support/render';

vi.mock('@navikt/nav-dekoratoren-moduler', () => ({
	onLanguageSelect: vi.fn(),
	setParams: vi.fn(),
}));

beforeEach(() => {
	vi.useFakeTimers();
	// App logs the locale on every render
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
	window.history.replaceState(null, '', '/finn-nav-kontor');
	document.documentElement.lang = 'nb';
	document.title = 'Finn Nav-kontor - nav.no';
});

afterEach(() => {
	vi.useRealTimers();
	window.history.replaceState(null, '', '/');
	document.documentElement.lang = '';
	document.title = '';
});

test('bytter språk i appen når språk velges i dekoratøren', async () => {
	const { user } = await renderAndSettle(<App locale="nb" />);
	expect(onLanguageSelect).toHaveBeenCalledTimes(1);
	const selectLanguage = vi.mocked(onLanguageSelect).mock.calls[0][0];

	const input = screen.getByRole('combobox');
	await user.type(input, 'evje@');
	expect(screen.getByText('Søket inneholder ugyldige tegn')).toBeInTheDocument();

	act(() => selectLanguage({ locale: 'en', handleInApp: true }));

	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Find Nav office$/);
	expect(input).toHaveAccessibleName('Enter address, post code or town/city');
	// State survives the switch; the validation message is re-rendered in the new language
	expect(input).toHaveValue('evje@');
	expect(screen.getByText('Invalid characters in search')).toBeInTheDocument();
	expect(window.location.pathname).toBe('/finn-nav-kontor/en');
	expect(document.documentElement.lang).toBe('en');
	expect(document.title).toBe('Find Nav office - nav.no');
	expect(setParams).toHaveBeenLastCalledWith(getDecoratorParams('en'));

	act(() => selectLanguage({ locale: 'nn', handleInApp: true }));

	expect(input).toHaveAccessibleName('Skriv inn adresse, postnummer eller stad/by');
	expect(window.location.pathname).toBe('/finn-nav-kontor/nn');
	expect(document.documentElement.lang).toBe('nn');
	expect(setParams).toHaveBeenLastCalledWith(getDecoratorParams('nn'));

	act(() => selectLanguage({ locale: 'nb', handleInApp: true }));

	expect(input).toHaveAccessibleName('Skriv inn adresse, postnummer eller sted/by');
	expect(window.location.pathname).toBe('/finn-nav-kontor');
	expect(document.documentElement.lang).toBe('nb');
	expect(document.title).toBe('Finn Nav-kontor - nav.no');
	expect(setParams).toHaveBeenCalledTimes(3);
});
