import { act, screen } from '@testing-library/react';
import React from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AppLocale } from '../../../common/localization/types';
import { App } from '../App';
import { render as renderToHtml } from '../main-server';
import { setupUser, settleLoginStatus } from './support/render';

const texts = {
	nb: {
		title: 'Finn Nav-kontor',
		label: 'Skriv inn adresse, postnummer eller sted/by',
		invalid: 'Søket inneholder ugyldige tegn',
	},
	nn: {
		title: 'Finn Nav-kontor',
		label: 'Skriv inn adresse, postnummer eller stad/by',
		invalid: 'Søket inneheld ugyldige teikn',
	},
	en: {
		title: 'Find Nav office',
		label: 'Enter address, post code or town/city',
		invalid: 'Invalid characters in search',
	},
} satisfies Record<AppLocale, Record<string, string>>;

beforeEach(() => {
	vi.useFakeTimers();
	// App logs the locale on every render
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.useRealTimers();
});

describe.each(['nb', 'nn', 'en'] as const)('SSR og hydrering på %s', (locale) => {
	test('server-rendret markup hydreres uten avvik og blir interaktiv', async () => {
		const t = texts[locale];
		const container = document.createElement('main');
		container.innerHTML = renderToHtml(locale);
		document.body.append(container);

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(new RegExp(`^${t.title}$`));
		expect(screen.getByRole('combobox')).toHaveAccessibleName(t.label);

		const onRecoverableError = vi.fn();
		const consoleError = vi.spyOn(console, 'error');
		let root: Root | undefined;
		act(() => {
			root = hydrateRoot(container, <App locale={locale} />, { onRecoverableError });
		});
		await settleLoginStatus();

		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(consoleError).not.toHaveBeenCalled();

		const user = setupUser();
		await user.type(screen.getByRole('combobox'), '@');
		expect(screen.getByText(t.invalid)).toBeInTheDocument();

		act(() => root?.unmount());
		container.remove();
	});
});
