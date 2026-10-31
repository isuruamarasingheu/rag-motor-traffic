---
name: ocr-number-check
description: Finds and flags every number, unit, date, fine amount and section reference in OCR-extracted text from scanned gazettes so a human can verify them against the original image. Use whenever OCR output or scanned legal PDFs are processed, before text enters the corpus.
---

# OCR Number Check

## Why
In legal text a single misread digit (a decibel limit, a fine, a date, a section number) makes a wrong answer. Numbers must be **human-verified**, never assumed.

## Steps
1. **Run extraction** and keep per-page images (e.g. 200-300 dpi PNG) in `data/interim/<doc>/pages/`.
2. **List all numeric items** from the OCR text: integers, decimals, currency (Rs., /-), units (dB, dB(A), kW, cc, kg, metres), dates, gazette numbers, section/regulation references.
3. For each item record: `doc`, `page`, `line or bbox if available`, `ocr_value`, `context_snippet` (about 15 words around it), `confidence` if the OCR gives one, `suspicion_flags`.
4. **Flag as suspicious** when any of these apply:
   - confusable characters nearby (O/0, l/1/I, S/5, B/8, Z/2, comma vs period)
   - unit missing or odd for the context
   - value outside a plausible range for its context
   - same item appears with different values elsewhere in the document
   - OCR confidence below threshold
   - a section number breaks the expected sequence
5. **Write the report** to `data/interim/<doc>/number_report.csv` and a readable `number_report.md` grouped by page, with the page image path next to each item.
6. **Wait for the human.** The user marks each item `verified`, `corrected: <value>` or `unreadable`. Only then apply corrections.
7. After corrections, **re-run the extraction of numbers and diff** against the verified list to make sure nothing regressed.
8. Mark the document `verified: true` in its metadata only when every flagged item is resolved.

## Never
- Never silently correct a number, even if you are "pretty sure".
- Never infer a missing number from other sources without recording it as a human decision.
- Never mark a document verified yourself.

## Report back
Counts: total numbers, flagged, verified, corrected, unreadable. List unresolved items first.
