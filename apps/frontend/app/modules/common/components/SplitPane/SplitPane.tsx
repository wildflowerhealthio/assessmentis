import { cn } from '@assessmentis/react-util'

import styles from './SplitPane.module.css'

interface IProps {
  className?: string
  left: React.ReactNode
  right: React.ReactNode
}

const SplitPane = ({ className, left, right }: IProps) => {
  return (
    <div className={cn(className, styles.SplitPane)}>
      {left}
      {right}
    </div>
  )
}

export default SplitPane
