import { Bydel } from './bydel';

export enum PostnrKategori {
    GateadresserOgPostbokser = 'B',
    Felles = 'F',
    Gateadresser = 'G',
    Postbokser = 'P',
    Servicepostnummer = 'S',
}

export type PostnrDataOld = {
    postnr: string;
    poststedNormalized: string;
    poststed: string;
    kommunenr: string;
    kommune: string;
    kategori: PostnrKategori;
    bydeler?: Bydel[];
};
