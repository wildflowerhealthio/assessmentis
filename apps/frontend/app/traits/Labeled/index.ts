/* eslint-disable import/no-unassigned-import -- Barrel that registers all Labeled trait implementations */
import './implementations/composition'
import './implementations/encounter'
import './implementations/location'
import './implementations/observation'
import './implementations/patient'
import './implementations/practitioner'
import './implementations/questionnaire'
import './implementations/questionnaire-response'
/* eslint-enable import/no-unassigned-import */
export * from './apply-labeled'
export * from './labeled'
