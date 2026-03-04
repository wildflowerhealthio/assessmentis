import { patientConfig } from 'app/modules/resources/Patient/resourcePagesConfig'
import { makeResourceListIndexPage } from 'app/modules/resources/ResourcePages/makeResourceListIndexPage'

const PatientIndexPage = makeResourceListIndexPage(patientConfig)
export default PatientIndexPage
