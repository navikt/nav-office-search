import { PostnrData } from '../api/data/data';
import { LocaleStringId } from '../localization/nb-default';

export type OfficeInfo = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
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
