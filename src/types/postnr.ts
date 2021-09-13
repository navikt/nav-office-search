import { BydelData } from '../api/data/bydeler';

export enum PostnrKategori {
    GateadresserOgPostbokser = 'B',
    Felles = 'F',
    Gateadresser = 'G',
    Postbokser = 'P',
    Servicepostnummer = 'S',
}

export type PostnrRegisterData = {
    postnr: string;
    poststedNormalized: string;
    poststed: string;
    kommunenr: string;
    kommune: string;
    kategori: PostnrKategori;
    bydeler?: BydelData[];
};
