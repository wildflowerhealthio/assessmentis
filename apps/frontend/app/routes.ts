import type { RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default flatRoutes({
  ignoredRouteFiles: ['home.tsx', '**/*.md'],
  rootDirectory: './routes',
}) satisfies RouteConfig
