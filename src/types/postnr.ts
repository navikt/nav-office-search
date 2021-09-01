import { Bydel } from './bydel';

export enum PostnrKategori {
    GateadresserOgPostbokser = 'B',
    Felles = 'F',
    Gateadresser = 'G',
    Postbokser = 'P',
    Servicepostnummer = 'S',
}

export type PostnrData = {
    postnr: string;
    poststedNormalized: string;
    poststed: string;
    kommunenr: string;
    kategori: PostnrKategori;
    bydeler?: Bydel[];
};
