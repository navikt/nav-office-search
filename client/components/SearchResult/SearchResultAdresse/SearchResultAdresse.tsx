import React from 'react';
import type { Adresse, SearchResultAdresseProps } from '#shared/types/results.ts';
import style from './SearchResultAdresse.module.css';
import { LocaleString } from '#client/localization/LocaleString.tsx';
import { formatAddressLabel, getAddressOptionId, getAddressSuggestionCounts } from './addressSuggestions.ts';
import { HighlightedText } from '#client/components/HighlightedText/HighlightedText.tsx';

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
	if (result.adresser.length === 0) {
		return (
			<div className={style.dropdown} id={listboxId} role="listbox" aria-label={listboxLabel}>
				<div className={style.empty} role="option" aria-disabled="true" aria-selected="false">
					<LocaleString id={'nameResultNone'} args={[result.adresseQuery]} />
				</div>
			</div>
		);
	}

	const { visibleHits, totalHits, hasMoreThanVisibleRows } = getAddressSuggestionCounts(result);

	return (
		<div className={style.dropdown}>
			{hasMoreThanVisibleRows && (
				<div className={style.hint} role="presentation">
					<LocaleString id={'addressSuggestionsRefine'} args={[visibleHits.toString(), totalHits.toString()]} />
				</div>
			)}
			<div className={style.list} id={listboxId} role="listbox" aria-label={listboxLabel}>
				{result.adresser.map((adresse, index) => {
					const label = formatAddressLabel(adresse);
					const isActive = activeIndex === index;

					return (
						<div
							id={getAddressOptionId(listboxId, index)}
							key={label}
							className={style.item}
							data-active={isActive || undefined}
							role="option"
							aria-label={label}
							aria-selected={isActive}
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => onAddressMouseEnter(index)}
							onClick={() => onAddressSelect(adresse)}
						>
							<HighlightedText text={label} input={result.adresseQuery} />
						</div>
					);
				})}
			</div>
		</div>
	);
};
