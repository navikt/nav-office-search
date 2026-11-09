import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App.tsx';
import type { AppLocale } from '#shared/localization/types.ts';

export const render = (locale: AppLocale) => {
	return renderToString(<App locale={locale} />);
};
