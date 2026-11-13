# Upstream fixtures

Responses from the services the server depends on, shaped exactly like each service's own wire format. Nothing in
here is computed by this app's code, so tests that use them can't pass just by agreeing with themselves.

| File | Upstream | Origin |
| --- | --- | --- |
| `bring/postnummerregister-ansi.txt` | `https://www.bring.no/postnummerregister-ansi.txt` | Earlier capture, bytes unchanged (windows-1252, tab-separated, trailing newline). Pre-2024 kommune numbers. |
| `ssb/classification-103.json` | `https://data.ssb.no/api/klass/v1/classifications/103` | Captured 2026-10-07. |
| `ssb/version.json` | `https://data.ssb.no/api/klass/v1/versions/1168` (Bydelsinndeling 2020, the current version) | Captured 2026-10-07. Its `classificationItems` are identical to the earlier capture this replaced. |
| `xp/office-info.json` | XP `/_/service/no.nav.navno/officeInfo` | Earlier dev capture (`{ offices: [{ enhetNr, path }] }`). |
| `office-search-api/geoids.json` | nav-office-search-api `GET /geoids` | The whole answer: `{ <geoId>: { enhetNr, navn } }`. Derived once from the old dev snapshot's office lookups, so it has the ids the app asked about then, not every area NORG maps. `2100` (Svalbard → Nav Tromsø), and `2211` (Jan Mayen) having no office, were checked against the dev API on 2026-10-08. Note that the live backend no longer knows `5401` (Tromsø is `5501` since 2024); it stays here because this snapshot's register still uses it. |
| `office-search-api/adresse.json` | nav-office-search-api `GET /adresse?queryString=<query>` | Hand-written `{ status, body }` per query string, in the backend's shapes: `{ totalHits, adresser }` (at most 30 per page) or `{ error }`. |
| `office-search-api/bydel.json` | nav-office-search-api `GET /bydel?postnummer=<postnummer>` | Hand-written `{ status, body }` per postnummer: `{ bydeler }` or `{ error }`. |

The register, the office ids and the hand-written addresses come from the same pre-2024 dev snapshot, so they agree
with each other, even though they are out of date (e.g. Nordre Follo is 3020, Tromsø is 5401). Refreshing them is a
fixture-only change that should regenerate them together.

nav-office-search-api's behaviour that the fixtures mirror (see its `server/offices/` and `server/pdl/`):

- `/geoids`: 503 `{ error }` until it has loaded the offices from NORG, never an empty object. The fakes have always
  loaded them.
- `/adresse`: query over 150 characters, or empty after stripping everything but letters, digits, whitespace and
  `.,-` → 400 `{ error }`; PDL failure → 502 `{ error }`.
- `/bydel`: missing or non-four-digit postnummer → 400 `{ error }`.

`test/upstream/fakes.ts` answers from these files, in offline development and in the HTTP tests.

These files are not formatted by oxfmt.
