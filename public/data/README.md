# Electorate boundary data

GeoJSON boundary files for the interactive electorate map (`/map`).

## Files

| File | Status | Source |
|---|---|---|
| `general-electorates-2020.geojson` | **Authoritative** | Stats NZ Geographic Data Service — General Electorates 2020 (layer 104580), CC BY 4.0. 65 electorates. Exported via WFS (EPSG:4326), simplified ~4% with mapshaper → ~379 KB. |
| `maori-electorates-2020.geojson` | **Authoritative** | Stats NZ Geographic Data Service — Māori Electorates 2020 (layer 104579), CC BY 4.0. 7 electorates. Exported via WFS (EPSG:4326), simplified ~4% with mapshaper → ~74 KB. |

NZ has **65 general + 7 Māori = 72 electorate seats** (remaining seats in the 123-seat House are party-list seats).

## Pipeline (how these were produced)

WFS export from Stats NZ (key in `.env.local` as `STATS_NZ_API_KEY`):

```
curl "https://datafinder.stats.govt.nz/services;key=KEY/wfs?service=WFS&version=2.0.0\
&request=GetFeature&typeNames=layer-104580&count=1000&outputFormat=json&srsName=EPSG:4326"

mapshaper <raw>.geojson \
  -rename-fields name=GED2020_V1_00_NAME \   # MED2020_V1_00_NAME for Māori
  -filter-fields name \
  -simplify 4% keep-shapes \
  -clean \
  -o format=geojson precision=0.0001 <out>.geojson
```

Layers: `104580` = General Electorates 2020, `104579` = Māori Electorates 2020.

The map (`src/components/map/electorate-map.tsx`) reads the electorate name from
a list of candidate property keys (see `ELECTORATE_NAME_PROPS` in
`src/constants/electorates-data.ts`), so the `name` field is standardised here.

## Attribution

Boundary geometry © Statistics New Zealand, licensed for reuse under the
Creative Commons Attribution licence. Māori electorate sample derived via the
NZ Herald open-data conversion (github.com/nzherald/nz_maori_electorates_geojson).
