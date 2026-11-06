"use client";

export default function ErrorPage({ reset }) {
  return (
    <main className="shell">
      <div className="panel" role="alert">
        <h2>Something went wrong</h2>
        <p>The page hit an unexpected error. Your saved data is not affected.</p>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
