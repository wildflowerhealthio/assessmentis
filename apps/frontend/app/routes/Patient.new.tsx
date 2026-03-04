import { patientConfig } from 'app/modules/resources/Patient/resourcePagesConfig'
import { makeCreateResourcePage } from 'app/modules/resources/ResourcePages/makeCreateResourcePage'

const PatientNewPage = makeCreateResourcePage(patientConfig)
export default PatientNewPage
