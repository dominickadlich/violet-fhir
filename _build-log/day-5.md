## Verification: `get_medications` via MCP Inspector

### Steps
1. `tsc`
2. `node build/index.js`
3. `npx @modelcontextprotocol/inspector@latest node build/index.js`

### Result — patient `137237825`

```json
[
  {
    "name": "Carvedilol",
    "status": "active",
    "authoredOn": "Unknown authored date",
    "instructions": "12.5 mg twice daily (target: 25 mg twice daily)",
    "route": "Unknown route",
    "doseAndRate": "Unknown strength Unknown unit"
  },
  {
    "name": "Lisinopril",
    "status": "active",
    "authoredOn": "Unknown authored date",
    "instructions": "10 mg once daily (target: 20 mg once daily)",
    "route": "Unknown route",
    "doseAndRate": "Unknown strength Unknown unit"
  },
  {
    "name": "Spironolactone",
    "status": "active",
    "authoredOn": "Unknown authored date",
    "instructions": "25 mg once daily (target dose reached)",
    "route": "Unknown route",
    "doseAndRate": "Unknown strength Unknown unit"
  },
  {
    "name": "Dapagliflozin",
    "status": "active",
    "authoredOn": "Unknown authored date",
    "instructions": "10 mg once daily (target dose reached)",
    "route": "Unknown route",
    "doseAndRate": "Unknown strength Unknown unit"
  },
  {
    "name": "Furosemide",
    "status": "active",
    "authoredOn": "Unknown authored date",
    "instructions": "40 mg once daily, weight-based adjustment as needed",
    "route": "Unknown route",
    "doseAndRate": "Unknown strength Unknown unit"
  }
]
```

### Sanity check against raw FHIR data

Compared tool output against the raw resource behind the first entry to confirm
whether `authoredOn` / `route` / `doseAndRate` were being mis-extracted or were
genuinely absent from the source data.

```bash
curl -s \
  -H 'Accept: application/fhir+json' \
  -H 'Cache-Control: no-store' \
  'https://hapi.fhir.org/baseR4/MedicationRequest?patient=137237825&_count=5' \
  | jq '.entry[0].resource'
```

```json
{
  "resourceType": "MedicationRequest",
  "id": "137237876",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-07-28T06:39:25.597-04:00",
    "source": "#eeordxYsV5FoMmNi"
  },
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "19484",
        "display": "Carvedilol"
      }
    ],
    "text": "Carvedilol"
  },
  "subject": {
    "reference": "Patient/137237825"
  },
  "reasonCode": [
    {
      "text": "Beta Blocker"
    }
  ],
  "dosageInstruction": [
    {
      "text": "12.5 mg twice daily (target: 25 mg twice daily)"
    }
  ]
}
```

**Conclusion:** confirmed, not a bug. The raw resource has no `authoredOn` field
and `dosageInstruction[0]` contains only `text` — no `route`, no `doseAndRate`.
`resolveDosageInstructions`'s optional chaining and `?? 'Unknown ...'` fallbacks
are behaving exactly as designed against genuinely sparse source data, not
silently swallowing real values. Verified deliberately rather than assumed.