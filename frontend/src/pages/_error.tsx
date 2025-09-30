import React from "react"

type ErrorProps = { statusCode?: number }

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Error {statusCode ?? 500}</h1>
        <p>Sorry, something went wrong.</p>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
