import React, { createContext, useContext } from 'react';
import { AppLocale } from '../../../common/localization/types';

const LocaleContext = createContext<AppLocale>('nb');

export const useLocale = () => {
    return useContext(LocaleContext);
};

type LocaleProviderProps = { value: AppLocale; children: React.ReactNode };

export const LocaleProvider = ({ value, children }: LocaleProviderProps) => {
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
