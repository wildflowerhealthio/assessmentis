import classes from './PageLoader.module.css'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message }: PageLoaderProps): React.JSX.Element {
  return (
    <div className={classes.PageLoader}>
      <div className={classes.PageLoader__spinner} />
      {message && <p className="body-3">{message}</p>}
    </div>
  )
}
