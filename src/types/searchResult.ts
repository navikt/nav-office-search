import { LocaleStringId } from '../localization/nb-default';
import { PostnrData } from '../api/data/poststed';

export type OfficeInfo = {
    name: string;
    enhetNr: string;
    url: string;
    hitString: string;
    geoId: string;
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
