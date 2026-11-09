import React from 'react';
import type { SearchResultPostnrProps } from '#shared/types/results.ts';
import { OfficeLink } from '#client/components/OfficeLink/OfficeLink.tsx';
import { BodyLong, VStack } from '@navikt/ds-react';
import { PostnrKategori } from '#shared/types/data.ts';
import { LocaleString } from '#client/localization/LocaleString.tsx';

import style from './SearchResultPostnr.module.css';

const HeaderText = (result: SearchResultPostnrProps) => {
	const { postnr, poststed, kommuneNavn, kategori, officeInfo } = result;

	const postnrOgPoststed = `${postnr} ${poststed}`;

	const numHits = officeInfo.length;

	if (numHits === 0) {
		return <LocaleString id={'postnrResultNone'} args={[postnrOgPoststed]} />;
	}

	if (numHits > 1) {
		if (kategori === PostnrKategori.Postbokser) {
			return <LocaleString id={'postnrResultPostbox'} args={[postnr, kommuneNavn, numHits.toString()]} />;
		}

		if (kategori === PostnrKategori.Servicepostnummer) {
			return <LocaleString id={'postnrResultServiceBox'} args={[postnr, kommuneNavn, numHits.toString()]} />;
		}

		return <LocaleString id={'postnrResultMany'} args={[numHits.toString(), postnrOgPoststed]} />;
	}

	return <LocaleString id={'postnrResultOne'} args={[postnrOgPoststed]} />;
};

type Props = {
	result: SearchResultPostnrProps;
	resultInput?: string | null;
};

export const SearchResultPostnr = ({ result, resultInput }: Props) => {
	const { officeInfo } = result;

	if (!officeInfo) {
		return (
			<div className={style.error}>
				<LocaleString id={'errorInvalidResult'} />
			</div>
		);
	}

	return (
		<div>
			<BodyLong className={style.header}>
				{resultInput ? (
					<LocaleString
						id={officeInfo.length === 0 ? 'nameResultNone' : 'nameResultFound'}
						args={[resultInput, officeInfo.length.toString()]}
					/>
				) : (
					<HeaderText {...result} />
				)}
			</BodyLong>
			<VStack gap="space-12">
				{officeInfo.map((hit) => (
					<OfficeLink key={hit.enhetNr} officeInfo={hit} />
				))}
			</VStack>
		</div>
	);
};
