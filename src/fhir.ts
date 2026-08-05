import "fhir/r4.js";

type MedicationRequest = fhir4.MedicationRequest;
type Bundle<T extends fhir4.Resource> = fhir4.Bundle<T>;
type OperationOutcome = fhir4.OperationOutcome;

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

type FetchResult =
  | { kind: 'ok'; bundle: Bundle<MedicationRequest> }
  | { kind: 'empty'; patientId: string }
  | { kind: 'unavailable'; status?: number; detail: string }
  | { kind: 'bad_request'; status: number; detail: string };

  export function resolveMedicationName(request: MedicationRequest) {

    if (request.medicationCodeableConcept) {
        const rxnormCoding = request.medicationCodeableConcept?.coding?.find((c) => c.system === RXNORM_SYSTEM)        
        if (rxnormCoding) {            
            return rxnormCoding.display   
        }

        const displayCoding = request.medicationCodeableConcept?.coding?.find((c) => c.display)
        if (displayCoding) {
            return displayCoding.display
        }
        return request.medicationCodeableConcept?.text
    } 
    // else if (request.medicationReference?.reference?.startsWith('#')) {
    //     if (request.medicationReference)
    // }
    return 'Unable to determine drug name'
  }

export async function fetchMedications({
    patientId
}: {
    patientId: string,
}): Promise <FetchResult> {
    const USER_AGENT = 'fetch_medications/1.0'
    const url = new URL('https://hapi.fhir.org/baseR4/MedicationRequest')
    url.searchParams.set('patient', patientId)

    const headers = {
        "User-Agent": USER_AGENT,
        Accept: 'application/fhir+json'
    };

    try {
        const response = await fetch(url, { headers })
        if (!response.ok) {
            const outcome: OperationOutcome = await response.json()
            if (response.status >= 500) {
                if (outcome.resourceType === "OperationOutcome") {
                    return { kind: 'unavailable', status: response.status, detail: outcome.issue?.[0]?.diagnostics  ?? 'Server error'};
                }
                return { kind: 'unavailable', status: response.status, detail: 'Server error'};
            }
            
            if (outcome.resourceType === "OperationOutcome") {
                return { kind: 'bad_request', status: response.status, detail: outcome.issue?.[0]?.diagnostics  ?? 'Bad Request'};
            }
            return { kind: 'bad_request', status: response.status, detail: 'Bad Request'};
        }

        
        if (!response.ok) {
            const outcome: OperationOutcome = await response.json()
            const diagnostics = outcome.resourceType === "OperationOutcome" ? outcome.issue?.[0]?.diagnostics : null
            if (response.status >= 500) {
                    return { kind: 'unavailable', status: response.status, detail: diagnostics  ?? 'Server error'};
            }
            return { kind: 'bad_request', status: response.status, detail: diagnostics  ?? 'Bad Request'};
        }

        const bundle: Bundle<MedicationRequest> = await response.json();

        if (!bundle.entry?.length) {
            return { kind: 'empty', patientId };
        }

        return { kind: 'ok', bundle };
    } catch (error) {
        return { kind: 'unavailable', detail: error instanceof Error ? error.message : 'Error'};
    }
}