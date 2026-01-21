import { Questionnaire } from '@assessmentis/clinical-domain/content-management'
import { questionnaireTemplates } from '@assessmentis/questionnaire-entities'
import type { Route } from './+types/_resource.Questionnaire._index'
import { QuestionnaireListItem } from '../modules/resources/Questionnaire/components/QuestionnaireListItem/QuestionnaireListItem'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { createResourceCollectionHook } from '../modules/common/utils/createResourceCollectionHook'

const useQuestionnaires = createResourceCollectionHook<Questionnaire>({
  resourceType: 'Questionnaire',
})

export default function QuestionnairePage(_: Route.ComponentProps) {
  const {
    collectionPromise: questionnairesPromise,
    deleteItem: deleteQuestionnaire,
    createItem: createQuestionnaire,
  } = useQuestionnaires()
  useBreadcrumbs([{ label: 'Questionnaires' }])

  const loadTemplateByTitleForm = async function (formData: FormData) {
    const templateToCreate = questionnaireTemplates.find(
      (t) => t.title == formData.get('title')
    )
    if (templateToCreate) return await createQuestionnaire(templateToCreate)
  }

  return (
    <>
      <ResourceListPage
        title="Questionnaires"
        collectionPromise={questionnairesPromise}
        createPath=""
        createLabel="Create Questionnaire"
        onDelete={deleteQuestionnaire}
        ItemComponent={QuestionnaireListItem}
      />

      <div>
        <section>
          <h2 className="heading-4">Questionnaire Template Loader</h2>
          <div className="text-alt-heading-2">
            Click buttons to load templates
          </div>
          <div>
            {questionnaireTemplates.map(({ title }) => {
              return (
                <form key={title} action={loadTemplateByTitleForm}>
                  <input hidden name="title" defaultValue={title} />
                  <button className="element-button button-2" type="submit">
                    {title}
                  </button>
                </form>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
