import React, { Fragment } from 'react';
import { Adresse, SearchResultAdresseProps } from 'nav-office-search-common/types/results';
import style from './SearchResultAdresse.module.css';
import { LocaleString } from '../../../localization/LocaleString';
import {
    formatAddressLabel,
    getAddressLabelSegments,
    getAddressOptionId,
    getAddressSuggestionCounts,
} from './addressOptions';

type Props = {
    result: SearchResultAdresseProps;
    onAddressSelect: (adresse: Adresse) => void;
    onAddressMouseEnter: (index: number) => void;
    activeIndex: number | null;
    listboxId: string;
    listboxLabel: string;
};

export const SearchResultAdresse = ({
    result,
    onAddressSelect,
    onAddressMouseEnter,
    activeIndex,
    listboxId,
    listboxLabel,
}: Props) => {
    if (result.sokAdresse.hits.length === 0) {
        return (
            <div className={style.dropdown} id={listboxId} role="listbox" aria-label={listboxLabel}>
                <div
                    className={style.empty}
                    role="option"
                    aria-disabled="true"
                    aria-selected="false"
                >
                    <LocaleString id={'nameResultNone'} args={[result.adresseQuery]} />
                </div>
            </div>
        );
    }

    const { visibleHits, totalHits, hasMoreThanVisibleRows } = getAddressSuggestionCounts(result);

    return (
        <div className={style.dropdown}>
            <div className={style.list} id={listboxId} role="listbox" aria-label={listboxLabel}>
                {result.sokAdresse.hits.map((adresse, index) => {
                    const label = formatAddressLabel(adresse);
                    const labelSegments = getAddressLabelSegments(label, result.adresseQuery);
                    const isActive = activeIndex === index;

                    return (
                        <div
                            id={getAddressOptionId(listboxId, index)}
                            key={`${label}-${index}`}
                            className={style.item}
                            data-active={isActive || undefined}
                            role="option"
                            aria-label={label}
                            aria-selected={isActive}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => onAddressMouseEnter(index)}
                            onClick={() => onAddressSelect(adresse)}
                        >
                            <span>
                                {labelSegments.map((segment, segmentIndex) =>
                                    segment.isMatch ? (
                                        <strong key={segmentIndex}>{segment.text}</strong>
                                    ) : (
                                        <Fragment key={segmentIndex}>{segment.text}</Fragment>
                                    )
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>
            {hasMoreThanVisibleRows && (
                <div className={style.hint} role="presentation">
                    <LocaleString
                        id={'addressSuggestionsRefine'}
                        args={[visibleHits.toString(), totalHits.toString()]}
                    />
                </div>
            )}
        </div>
    );
};
