import { patientConfig } from 'app/modules/resources/Patient/resourcePagesConfig'
import { makeEditResourcePage } from 'app/modules/resources/ResourcePages/EditResourcePage'

const PatientEditPage = makeEditResourcePage(patientConfig)

export default PatientEditPage
