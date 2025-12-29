import { Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireId,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/content-management'
import { questionnaireTemplates } from '@assessmentis/questionnaire-entities'
import type { Route } from './+types/_resource.Questionnaire._index'
import { useResourceRunEffect } from '../clientRuntime'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { QuestionnaireListItem } from '../modules/resources/Questionnaire/components/QuestionnaireListItem/QuestionnaireListItem'
import { useMemo } from 'react'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export async function clientLoader(_: Route.ClientLoaderArgs) {}

const useQuestionnaires = () => {
  const questionnaires = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const questionnaireRepository = yield* QuestionnaireRepository
        return yield* questionnaireRepository.getMany()
      })
    }, [])
  )
  return useClinicalDataCollection<
    QuestionnaireId,
    Questionnaire,
    QuestionnaireRepository,
    typeof QuestionnaireRepository,
    never
  >(QuestionnaireRepository, questionnaires)
}

export default function QuestionnairePage(_: Route.ComponentProps) {
  const {
    collection: questionnaires,
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
        collection={questionnaires}
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
