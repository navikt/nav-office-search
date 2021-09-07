import { LocaleStringId } from '../localization/LocaleString';
import { PostnrData } from '../data/data';

export type OfficeInfo = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    adressenavn: string;
    error?: undefined;
};

export type SearchResultPostnrProps = {
    type: 'postnr';
    adresseQuery?: string;
    error?: undefined;
} & PostnrData;

export type NameHit = { name: string; officeHits: OfficeInfo[] };

export type SearchResultNameProps = {
    type: 'name';
    nameHits: NameHit[];
    input: string;
    error?: undefined;
};

export type SearchResultErrorProps = {
    type: 'error';
    aborted?: boolean;
    messageId?: LocaleStringId;
};

export type SearchResultProps =
    | SearchResultPostnrProps
    | SearchResultNameProps
    | SearchResultErrorProps;
