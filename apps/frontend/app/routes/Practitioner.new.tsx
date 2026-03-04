import { practitionerConfig } from 'app/modules/resources/Practitioner/resourcePagesConfig'
import { makeCreateResourcePage } from 'app/modules/resources/ResourcePages/makeCreateResourcePage'

const PractitionerNewPage = makeCreateResourcePage(practitionerConfig)
export default PractitionerNewPage
