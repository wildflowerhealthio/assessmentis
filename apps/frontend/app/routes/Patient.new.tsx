import { makeCreateResourcePage } from 'app/modules/resources/ResourcePages/makeCreateResourcePage'
import { patientConfig } from 'app/modules/resources/Patient/resourcePagesConfig'

const PatientNewPage = makeCreateResourcePage(patientConfig)
export default PatientNewPage
