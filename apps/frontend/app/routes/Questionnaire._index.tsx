import { Questionnaire } from '@assessmentis/clinical-domain'
import { questionnaireTemplates } from '@assessmentis/questionnaire-entities'

import { useResourceCollection } from '../layers/use-resource-collection'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/resource-list-page'
import { ResourceListItem } from '../modules/resources/ResourcePages/ResourceListItem/resource-list-item'

import '../traits/Labeled/implementations/questionnaire'
import '../traits/Listable/implementations/questionnaire'
import '../traits/BreadcrumbLabel/implementations/questionnaire'
import '../traits/Link/implementations/questionnaire'

function QuestionnaireListItem(props: {
  item: Questionnaire
  onDelete: () => void
  loading: boolean
}): React.JSX.Element {
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

export default function QuestionnairePage(): React.JSX.Element {
  const {
    collectionPromise: questionnairesPromise,
    deleteItem: deleteQuestionnaire,
    createItem: createQuestionnaire,
  } = useResourceCollection(Questionnaire)
  useBreadcrumbs(() => [Questionnaire], [])

  const loadTemplateByTitleForm = function loadTemplateByTitleForm(formData: FormData): void {
    const templateToCreate = questionnaireTemplates.find((t) => t.title === formData.get('title'))
    if (templateToCreate) {
      createQuestionnaire(templateToCreate)
    }
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
          <div className="text-alt-heading-2">Click buttons to load templates</div>
          <div>
            {questionnaireTemplates.map(({ title }) => (
              <form key={title} action={loadTemplateByTitleForm}>
                <input hidden name="title" defaultValue={title} />
                <button className="element-button button-2" type="submit">
                  {title}
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
