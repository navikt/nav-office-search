import React, { createContext, ProviderProps, useContext } from 'react';
import { AppLocale } from '../../common/localization/types';

const LocaleContext = createContext<AppLocale>('nb');

export const useLocale = () => {
    return useContext(LocaleContext);
};

export const LocaleProvider = (props: ProviderProps<AppLocale>) => {
    return <LocaleContext.Provider {...props} />;
};
