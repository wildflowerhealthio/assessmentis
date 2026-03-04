import { observationConfig } from 'app/modules/resources/Observation/resourcePagesConfig'
import { makeCreateResourcePage } from 'app/modules/resources/ResourcePages/makeCreateResourcePage'

const ObservationNewPage = makeCreateResourcePage(observationConfig)

export default ObservationNewPage
