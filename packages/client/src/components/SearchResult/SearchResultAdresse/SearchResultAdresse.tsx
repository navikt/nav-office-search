import React from 'react';
import { Adresse, SearchResultAdresseProps } from 'nav-office-search-common/types/results';
import style from './SearchResultAdresse.module.css';
import { Button } from '@navikt/ds-react';

type Props = {
    result: SearchResultAdresseProps;
    onAddressSelect: (adresse: Adresse) => void;
};

export const SearchResultAdresse = ({ result, onAddressSelect }: Props) => {
    return (
        <div className={style.list}>
            {result.sokAdresse.hits.map((adresse) => {
                const { adressenavn, husnummer, husbokstav } = adresse.vegadresse;
                const label = `${adressenavn} ${husnummer}${husbokstav ?? ''}, ${adresse.vegadresse.postnummer} ${adresse.vegadresse.poststed}`;
                return (
                    <Button
                        key={label}
                        className={style.item}
                        onClick={() => onAddressSelect(adresse)}
                        type="button"
                    >
                        {label}
                    </Button>
                );
            })}
        </div>
    );
};
