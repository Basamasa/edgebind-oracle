'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  console.error(error)

  return (
    <html>
      <body
        style={{
          margin: 0,
          background: "#031110",
          color: "#f3f5ec",
          fontFamily: "Avenir Next, Helvetica Neue, Segoe UI, sans-serif",
        }}
      >
        <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "24px",
              padding: "32px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#8ea38d",
              }}
            >
              Global Error
            </div>
            <h1 style={{ fontSize: "32px", marginTop: "16px", marginBottom: "12px" }}>
              The Next.js app hit an unexpected error.
            </h1>
            <p style={{ margin: 0, color: "#c3cdc0", lineHeight: 1.7 }}>
              {error.message || "Unknown error"}
            </p>
            {error.stack ? (
              <pre
                style={{
                  marginTop: "24px",
                  overflow: "auto",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "#071110",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                {error.stack}
              </pre>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  )
}
