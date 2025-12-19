import { TitleProps } from '@assessmentis/document-template-kinds/gad7-report'

export const Title = ({ title }: TitleProps) => {
  return <h2>{title ?? 'GAD-7 Anxiety Report'}</h2>
}
