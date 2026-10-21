"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#f7f3ec", color: "#1c1917", fontFamily: "Georgia, serif", padding: "4rem 1.5rem" }}>
        <h1>Something went wrong.</h1>
        <p>The details stay on the server. You can try the page again.</p>
        <button type="button" onClick={() => reset()} style={{ marginTop: "1rem", background: "#0e2433", color: "#f7f3ec", border: 0, padding: "0.7rem 1rem" }}>Try again</button>
      </body>
    </html>
  );
}
