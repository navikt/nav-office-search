# Upstream fixtures

What the services the server depends on answer, in their own wire format. Nothing in here is computed by this app's
code.

| File | Upstream | Origin |
| --- | --- | --- |
| `office-search-api/search.json` | nav-office-search-api `GET /search?query=<query>` | `{ status, body }` per query, as the API's own code answered on 2026-11-17 (its commit `6ca6396`), run on its test snapshot (`test/fixtures` there: NORG, XP and the two data files) with `NAVNO_ORIGIN=https://www.nav.no`. PDL isn't in that snapshot, so it answered from hand-written addresses and bydeler. |

The snapshot is from dev before 2024, so it is out of date (Nordre Follo is 3020, Tromsø is 5401), but it agrees with
itself.

What is recorded:

- Postnumre: `4737` (one office), `0354` (two bydeler, two offices), `0150`, `0184`, `0560`, `4014`, `5003` and `7014`
  (one bydel each), `1001` and `3560` (no office), `9170` and `8099` (Svalbard and Jan Mayen, which Nav Tromsø covers).
- Names: `oslo`, `bergen`, `frogner`, `unjarga`, `evje`, `trondheim`, `tromsø`, `stavanger`, `hornnes`, `ski` and
  `jevnaker`.
- Addresses: `storgata 1` (30 of 412), `tamburveien 1a`, `trondheimsveien 2`, `bryggen 1`, `vei 230 4`,
  `ole b. bergers veg 5`, `fergeleiet 1` (in an area without an office: its `officeInfo` is null),
  `ukjent adresse 1` (none found) and `???` (400 `errorInvalidQuery`).

`test/upstream/fakes.ts` answers from it, in offline development and in the server's tests. A query that isn't recorded
gets what the API answers when it finds nothing: 404 `errorInvalidPostnr` for four digits, and no addresses for
anything else. Without a query it answers 400 `errorMissingQuery`, as the API does.

To add an answer, or replace one, take it from a running nav-office-search-api. Its `pnpm dev` answers on
`http://localhost:3003/search?query=<query>`. PDL is faked there with the same two addresses for every search, so an
address answer needs its addresses written in by hand.

This file is not formatted by oxfmt.
