import { getAuthorizationHeader } from './auth';
import {
    FetchErrorResponse,
    fetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { OfficeInfo } from '../../types/searchResult';
import { urls } from '../../urls';
import { getOfficeUrl } from '../data/officeUrls';

type OfficeInfoResponse = {
    error: undefined;
    enhetId: number;
    navn: string;
    enhetNr: string;
    antallRessurser: number;
    status: string;
    orgNivaa: string;
    type: string;
    organisasjonsnummer: string;
    underEtableringDato: string;
    aktiveringsdato: string;
    underAvviklingDato: string;
    nedleggelsesdato: string;
    oppgavebehandler: boolean;
    versjon: number;
    sosialeTjenester: string;
    kanalstrategi: string;
    orgNrTilKommunaltNavKontor: string;
};

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<OfficeInfo | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    const response = await fetchJson<OfficeInfoResponse>(
        urls.officeInfoApi,
        { id },
        {
            headers: { Authorization: authorizationHeader },
        }
    );

    if (response.error) {
        return response;
    }

    return {
        name: response.navn,
        url: getOfficeUrl(response.enhetNr),
        geoId: id,
        enhetNr: response.enhetNr,
        hitString: '',
    };
};
