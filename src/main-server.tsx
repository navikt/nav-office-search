import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { AppLocale } from '../src-common/localization/types';

export const render = (locale: AppLocale) => {
    return renderToString(<App locale={locale} />);
};
