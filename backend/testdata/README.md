# Backend test fixtures

PDF samples for automated tests and a **shareable demo account** workflow.

## Files

| File | Type | Purpose |
|------|------|---------|
| `sample-lab-report.pdf` | Lab report | Small sample for `npm run test:gemini` and processing tests |
| `demo-lab-comprehensive-2025-02-14.pdf` | Lab report | **Baseline** — 37 catalog biomarkers (Feb 2025) |
| `demo-lab-comprehensive-2025-08-18.pdf` | Lab report | **Follow-up** — same panels with improved/worsened trends (Aug 2025) |
| `demo-prescription-2025-07-22.pdf` | Prescription | 5 medications tied to the lab story |
| `demo-patient.json` | Source data | Editable values used by the PDF generator |

Regenerate demo PDFs after editing JSON:

```bash
cd backend
npm run generate:demo-fixtures
```

## Demo patient (Alex Morgan)

Use this persona on documents **and** in your Vital profile so extraction, reference ranges, and trends align.

| Field | Value |
|-------|-------|
| Name | Alex Morgan |
| Date of birth | 1988-06-15 |
| Biological sex | Male |
| MRN (on PDFs) | VHL-DEMO-8842 |

Suggested profile values for onboarding: height **178 cm**, weight **82 kg** (adjust as you like).

## Shareable demo login setup

1. **Register** a dedicated account (e.g. `demo@vitalhealth.app` — use an email you control).
2. Choose a **strong password** and share credentials privately with reviewers.
3. Complete **onboarding** with Alex Morgan’s DOB and male sex.
4. Start the **document worker** (required for processing):

   ```bash
   cd backend
   npm run worker
   ```

5. **Upload in this order** (Records → Upload):

   1. `demo-lab-comprehensive-2025-02-14.pdf` (older baseline first)
   2. `demo-lab-comprehensive-2025-08-18.pdf` (recent follow-up)
   3. `demo-prescription-2025-07-22.pdf`

6. Wait for each document to reach **Completed** before uploading the next.

### Gemini free-tier tip

Each upload triggers classification + extraction (+ embeddings). On the free tier, **wait ~60 seconds between uploads** to avoid RPM rate limits. If processing fails, retry after a minute with the worker still running.

## What to showcase after upload

| Area | What reviewers should see |
|------|---------------------------|
| **Dashboard** | Recent activity, biomarker summary |
| **Records** | 3 documents with extracted labs and prescription fields |
| **Lab trends** | ~37 biomarkers; LDL, vitamin D, HbA1c, CRP show Feb → Aug trends |
| **AI Advocate** | Ask e.g. “How has my LDL changed?” or “Is my vitamin D still low?” |
| **Search** | Query “cholesterol”, “metformin”, “vitamin D” |
| **Fitness** | Complete wellness wizard; plan generation uses lab context |

### Key trend story (Feb → Aug)

- LDL: 142 → 118 mg/dL (concerning → borderline)
- Vitamin D: 22 → 34 ng/mL (low → normal)
- HbA1c: 5.8 → 5.5% (borderline → normal)
- CRP: 4.2 → 2.8 mg/L (elevated → normal)

## Notes

- All demo documents use **fictional** patient, clinic, and lab names.
- `sample-lab-report.pdf` remains the lightweight file for CI/scripts; use the `demo-*` files for portfolio demos.
