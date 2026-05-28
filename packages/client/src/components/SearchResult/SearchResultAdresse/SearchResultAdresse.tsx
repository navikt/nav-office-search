import React from 'react';
import { Adresse, SearchResultAdresseProps } from 'nav-office-search-common/types/results';
import style from './SearchResultAdresse.module.css';
import { Button } from '@navikt/ds-react';
import { HighlightedText } from '../../HighlightedText/HighlightedText';

type Props = {
    result: SearchResultAdresseProps;
    onAddressSelect: (adresse: Adresse) => void;
    input: string;
};

export const SearchResultAdresse = ({ result, onAddressSelect, input }: Props) => {
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
                        <HighlightedText text={label} input={input} />
                    </Button>
                );
            })}
        </div>
    );
};
