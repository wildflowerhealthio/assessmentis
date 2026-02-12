import { makeResourceListIndexPage } from 'app/modules/resources/ResourcePages/makeResourceListIndexPage'
import { patientConfig } from 'app/modules/resources/Patient/resourcePagesConfig'

const PatientIndexPage = makeResourceListIndexPage(patientConfig)
export default PatientIndexPage
