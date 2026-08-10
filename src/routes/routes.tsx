import { useEffect } from 'react'
import { createBrowserRouter, useLocation } from 'react-router-dom'
import { routeMetadata } from './routeMetadata'
import type { ReactNode} from 'react'
function RouteTitle({
                      title,
                      children,
                    }: {
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} — Shade`
  }, [title])

  return children
}

function PlaceholderPage({
                           heading,
                           title,
                         }: {
  heading: string
  title: string
}) {
  return (
      <RouteTitle title={title}>
        <main>
          <h1 tabIndex={-1}>{heading}</h1>
        </main>
      </RouteTitle>
  )
}

function NotFoundPage() {
  return (
      <RouteTitle title={routeMetadata.notFound.title}>
        <main>
          <h1 tabIndex={-1}>{routeMetadata.notFound.heading}</h1>
        </main>
      </RouteTitle>
  )
}

export const router = createBrowserRouter([
  {
    path: routeMetadata.dashboard.path,
    element: (
        <PlaceholderPage
            heading={routeMetadata.dashboard.heading}
            title={routeMetadata.dashboard.title}
        />
    ),
  },
  {
    path: routeMetadata.books.path,
    element: (
        <PlaceholderPage
            heading={routeMetadata.books.heading}
            title={routeMetadata.books.title}
        />
    ),
  },
  {
    path: routeMetadata.bookDetails.path,
    element: (
        <PlaceholderPage
            heading={routeMetadata.bookDetails.heading}
            title={routeMetadata.bookDetails.title}
        />
    ),
  },
  {
    path: routeMetadata.newBook.path,
    element: (
        <PlaceholderPage
            heading={routeMetadata.newBook.heading}
            title={routeMetadata.newBook.title}
        />
    ),
  },
  {
    path: routeMetadata.loans.path,
    element: (
        <PlaceholderPage
            heading={routeMetadata.loans.heading}
            title={routeMetadata.loans.title}
        />
    ),
  },
  {
    path: routeMetadata.notFound.path,
    element: <NotFoundPage />,
  },
])