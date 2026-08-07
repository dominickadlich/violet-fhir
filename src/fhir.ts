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


function bestDisplayName(concept: fhir4.CodeableConcept | undefined): string | undefined {

    const rxnormCoding = concept?.coding?.find((c) => c.system === RXNORM_SYSTEM)        
    if (rxnormCoding) {            
        return rxnormCoding.display   
    }

    const displayCoding = concept?.coding?.find((c) => c.display)
    if (displayCoding) {
        return displayCoding.display
    }
    return concept?.text
}

export function resolveMedicationName(request: MedicationRequest): string {

    if (request.medicationCodeableConcept) {
        return bestDisplayName(request.medicationCodeableConcept) ?? 'Unable to determine drug name'
    }

    const medRef = request.medicationReference
    if (medRef) {
        if (medRef?.reference?.startsWith('#')) {
            const refId = medRef.reference.slice(1)
            const containedMed = request.contained?.find((i) => i.id === refId)
            if (containedMed) {
                if (containedMed.resourceType === 'Medication') {
                    return bestDisplayName((containedMed as fhir4.Medication).code) ?? 'Unable to determine drug name'
                }
            } 
        }
        return request.medicationReference?.display ?? 'Unable to determine drug name'
    }
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