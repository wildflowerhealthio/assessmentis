import { Questionnaire } from '@assessmentis/clinical-domain'
import { questionnaireTemplates } from '@assessmentis/questionnaire-entities'

import { useResourceCollection } from '../layers/useResourceCollection'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { ResourceListItem } from '../modules/resources/ResourcePages/ResourceListItem/ResourceListItem'

import '../traits/Labeled/implementations/Questionnaire'
import '../traits/Listable/implementations/Questionnaire'
import '../traits/BreadcrumbLabel/implementations/Questionnaire'
import '../traits/Link/implementations/Questionnaire'
import '../traits/Listable/implementations/Questionnaire'

function QuestionnaireListItem(props: {
  item: Questionnaire
  onDelete: () => void
  loading: boolean
}) {
  const { displayName, summaryItems } = props.item.Listable

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={summaryItems}
      viewPath={`/Questionnaire/${props.item.url?.asUriComponent() ?? ''}`}
      editPath={`/Questionnaire/${props.item.url?.asUriComponent() ?? ''}`}
      onDelete={props.onDelete}
      loading={props.loading}
    />
  )
}

export default function QuestionnairePage() {
  const {
    collectionPromise: questionnairesPromise,
    deleteItem: deleteQuestionnaire,
    createItem: createQuestionnaire,
  } = useResourceCollection(Questionnaire)
  useBreadcrumbs(Questionnaire)

  const loadTemplateByTitleForm = async function (formData: FormData) {
    const templateToCreate = questionnaireTemplates.find(
      (t) => t.title == formData.get('title')
    )
    if (templateToCreate) return await createQuestionnaire(templateToCreate)
  }

  return (
    <>
      <ResourceListPage
        title={Questionnaire.Labeled.pluralLabel}
        collectionPromise={questionnairesPromise}
        createPath=""
        createLabel={`Create ${Questionnaire.Labeled.singularLabel}`}
        onDelete={(url) => deleteQuestionnaire(url?.toString())}
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
