import React from 'react';
import { SearchForm } from './SearchForm/SearchForm.tsx';
import { BodyLong, Button, Heading } from '@navikt/ds-react';
import { OfficeSearchIllustration } from './OfficeSearchIllustration/OfficeSearchIllustration.tsx';
import { LocaleString } from '#client/localization/LocaleString.tsx';
import { useLocale } from '#client/localization/useLocale.tsx';
import { useLoginStatus } from '#client/hooks/useLoginStatus.ts';
import { clientUrls } from '#client/urls.ts';

import style from './OfficeSearch.module.css';

export const OfficeSearch = () => {
	const { isUserLoggedIn } = useLoginStatus();
	const locale = useLocale();

	return (
		<div className={style.appContainer}>
			<div className={style.illustration}>
				<OfficeSearchIllustration />
			</div>
			<div className={style.content}>
				<Heading size={'xlarge'} level={'1'} spacing>
					<LocaleString id={'pageTitle'} />
				</Heading>
				<BodyLong spacing>
					<LocaleString id={'ingressLine1'} />
				</BodyLong>
				<BodyLong>
					<LocaleString id={'ingressLine2'} />
				</BodyLong>
				<Button variant={'secondary'} as={'a'} href={clientUrls.dittNavKontor(locale)} className={style.loginButton}>
					<LocaleString id={isUserLoggedIn ? 'loggedInButtonText' : 'loginButtonText'} />
				</Button>

				<Heading size={'medium'} level={'2'} spacing>
					<LocaleString id={'searchSectionTitle'} />
				</Heading>
				<BodyLong spacing>
					<LocaleString id={'searchSectionBody'} />
				</BodyLong>
				<SearchForm />
			</div>
		</div>
	);
};
