/**
 * Shared styling for the legend overlays on the electorate maps — the party
 * "Held by" key on /map and the margin key on /battlegrounds.
 *
 * A legend sits on top of the map, so its height comes straight out of the map
 * it explains. Stacked one row per entry it covered roughly a third of the map
 * on a phone (worse on /map, which lists six parties plus a pending row than on
 * /battlegrounds, which lists four tiers). Under 760px it becomes two compact
 * columns and gives that space back.
 *
 * Injected via a <style> tag by each map component rather than living in
 * globals.css, so the rules and the class names that use them always ship
 * together. The properties the media query overrides are deliberately NOT set
 * inline on the elements — an inline style would beat it.
 */
export const MAP_LEGEND_CSS = `
/* Cleared above the Leaflet attribution strip. That line carries the
   OpenStreetMap and CARTO credits their licences require, and the legend was
   sitting on top of it — a legal problem as much as a visual one. */
.map-legend { padding: 10px 12px; max-width: 220px; left: 12px; bottom: 30px; }
.map-legend-title { font-size: 10px; margin-bottom: 7px; }
.map-legend-items { display: flex; flex-direction: column; gap: 4px; }
.map-legend-row { gap: 7px; font-size: 11.5px; }
.map-legend-dot { width: 11px; height: 11px; }
.map-legend-note { margin-top: 2px; padding-top: 4px; }
@media (max-width: 760px) {
  /* 34px, not 26: on the narrowest phones the attribution wraps to two lines
     and the taller strip reached back under the legend. */
  .map-legend { padding: 7px 9px; left: 8px; bottom: 34px; max-width: 64%; }
  .map-legend-title { font-size: 9px; margin-bottom: 5px; }
  .map-legend-items { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; }
  .map-legend-row { gap: 5px; font-size: 10px; }
  .map-legend-dot { width: 8px; height: 8px; }
  /* The "data pending" caveat reads as a footnote, not a sixth party — it keeps
     its own full-width row under the two columns. */
  .map-legend-note { grid-column: 1 / -1; }
}
`
