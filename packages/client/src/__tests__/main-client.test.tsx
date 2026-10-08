import { act, screen } from '@testing-library/react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render as renderToHtml } from '../main-server';
import { settleLoginStatus } from './support/render';

// Pass-through spies, so main-client still really renders
vi.mock('react-dom/client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-dom/client')>();
	const spied = { ...actual, hydrateRoot: vi.fn(actual.hydrateRoot), createRoot: vi.fn(actual.createRoot) };
	return { ...spied, default: spied };
});

let mountedRoot: Root | undefined;

beforeEach(() => {
	// App logs the locale on every render
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
	vi.mocked(hydrateRoot).mockClear();
	vi.mocked(createRoot).mockClear();
	vi.resetModules();
});

afterEach(() => {
	act(() => mountedRoot?.unmount());
	mountedRoot = undefined;
	document.body.innerHTML = '';
	document.documentElement.lang = '';
});

/** main-client renders as a side effect of being imported */
const runMainClient = async () => {
	await act(async () => {
		await import('../main-client');
	});
	await settleLoginStatus();
};

test('hydrerer når #maincontent har server-rendret innhold, med språket fra <html lang>', async () => {
	const consoleError = vi.spyOn(console, 'error');
	document.documentElement.lang = 'nn';
	document.body.innerHTML = `<main id="maincontent">${renderToHtml('nn')}</main>`;

	await runMainClient();
	mountedRoot = vi.mocked(hydrateRoot).mock.results[0]?.value;

	expect(hydrateRoot).toHaveBeenCalledTimes(1);
	expect(hydrateRoot).toHaveBeenCalledWith(document.getElementById('maincontent'), expect.anything());
	expect(createRoot).not.toHaveBeenCalled();
	expect(screen.getByRole('combobox')).toHaveAccessibleName('Skriv inn adresse, postnummer eller stad/by');
	expect(consoleError).not.toHaveBeenCalled();
});

test('rendrer på klienten når #maincontent er tom', async () => {
	document.documentElement.lang = 'en';
	document.body.innerHTML = '<main id="maincontent"></main>';

	await runMainClient();
	mountedRoot = vi.mocked(createRoot).mock.results[0]?.value;

	expect(createRoot).toHaveBeenCalledTimes(1);
	expect(createRoot).toHaveBeenCalledWith(document.getElementById('maincontent'));
	expect(hydrateRoot).not.toHaveBeenCalled();
	expect(screen.getByRole('combobox')).toHaveAccessibleName('Enter address, post code or town/city');
});
