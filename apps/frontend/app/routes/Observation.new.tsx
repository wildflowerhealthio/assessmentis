import { makeCreateResourcePage } from 'app/modules/resources/ResourcePages/makeCreateResourcePage'
import { observationConfig } from 'app/modules/resources/Observation/resourcePagesConfig'

const ObservationNewPage = makeCreateResourcePage(observationConfig)

export default ObservationNewPage
