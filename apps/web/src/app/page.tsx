export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Base Launch Intelligence Console</p>

      <h1 style={{ marginTop: 12, marginBottom: 16, fontSize: 32 }}>
        Web app skeleton
      </h1>

      <p style={{ lineHeight: 1.6 }}>
        The Next.js shell is running. The ranked launch table, provider integrations,
        database queries, and scoring logic are intentionally not implemented in this task.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Current status</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>Placeholder page renders successfully.</li>
          <li>No browser-side provider API calls are made.</li>
          <li>No database query is required to load this page.</li>
          <li>No ranked launch table is implemented yet.</li>
        </ul>
      </section>
    </main>
  );
}
