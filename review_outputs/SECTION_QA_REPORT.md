# Section QA Report

## Integrity

- Handoff ZIP SHA256 verification: `INTEGRITY CHECK PASSED`.
- `bash` was unavailable, so the SHA256 manifest was verified with PowerShell using the same hashes.

## Viewport QA

| Width | Horizontal overflow | Console errors | Result |
| --- | --- | --- | --- |
| 360 | 0 px | None | Pass |
| 390 | 0 px | None | Pass |
| 430 | 0 px | None | Pass |
| 768 | 0 px | None | Pass |
| 1280 | 0 px | None | Pass |
| 1440 | 0 px | None | Pass |

## Priority-Zero Defects

| Defect | Result |
| --- | --- |
| Capacity desktop blank right panel / detached 35%-75% cards | Fixed |
| Competitor radar crop / overflow / weak mobile map | Fixed |
| Executive conclusion excessive whitespace / buried truth cards | Fixed |

## Interaction QA

| Interaction | Result |
| --- | --- |
| Patient decision tabs | Pass |
| Opportunity lens tabs | Pass |
| Calculator currency controls | Pass |
| Pricing currency controls | Pass |
| Calculator range sliders | Pass |
| Mobile slider drag | Pass |
| Delay cost buttons | Pass |
| Fit check buttons | Pass |
| Pricing scale buttons | Pass |
| WhatsApp CTA href | Pass |

## Animation QA

- Active coded animations detected: clinic scan, radar sweep, radar pulse, signal dots, and year-round rhythm SVG.
- Mobile radar sweep/pulse contained inside the radar map.
- `prefers-reduced-motion` rules preserved from the source file.

## No-Loss Matrix

- No pricing values changed.
- No calculator formulas changed.
- No CTA destination changed.
- No strategy section was removed.
- No personalized media placeholder was filled or removed.
- No new framework or dependency was added.
