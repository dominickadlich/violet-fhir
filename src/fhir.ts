import "fhir/r4.js";

type MedicationRequest = fhir4.MedicationRequest;
type Bundle<T> = fhir4.Bundle<T>;



export async function fetchMedications({
    patientId
}: {
    patientId: string,
}): Promise <Bundle<MedicationRequest> | null> {
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
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching medications for ${patientId}`)
        return null;
    }
}