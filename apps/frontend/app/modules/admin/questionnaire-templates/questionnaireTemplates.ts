import { Questionnaire } from '@assessmentis/domain/questionnaires'
import divaQuestionnaireItems from 'app/modules/admin/questionnaire-templates/data/diva2'

const divaTitle = 'Diagnostic Interview for ADHD in adults (DIVA) 2.0'
const diva2: Questionnaire = {
  resourceType: 'Questionnaire',
  title: divaTitle,
  name: divaTitle,
  status: 'draft',
  item: divaQuestionnaireItems,
}

const noItemsTitle = 'The Questionnaire With No Items'
const noItemsQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  title: noItemsTitle,
  name: noItemsTitle,
  status: 'draft',
  item: [],
}

const questionnaireTemplates: Questionnaire[] = [diva2, noItemsQuestionnaire]
export default questionnaireTemplates
