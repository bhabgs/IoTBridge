import { createHashRouter as Router, RouterProvider } from 'react-router-dom'
import LayoutBody from '../components/Layout/Layout'
import Home from '../pages/Home'
import Editor from '../pages/Editor'
import Settings from '../pages/Settings'
import Preview from '../pages/Preview'
import ProjectDetail from '@renderer/pages/Project'
import ProjectList from '@renderer/pages/Project/list'

export const Routers = Router([
  {
    path: '/',
    element: <LayoutBody />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'editor/:id',
        element: <Editor />
      },
      {
        path: 'preview/:id',
        element: <Preview />
      },
      {
        path: 'project',
        element: <ProjectList />
      },
      {
        path: 'project/:id',
        element: <ProjectDetail />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={Routers} />
}
