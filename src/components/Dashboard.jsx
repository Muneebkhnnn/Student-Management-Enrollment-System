export function Dashboard({ stats }) {
  const items = [
    ["Total students", stats?.total],
    ["Active", stats?.active],
    ["Inactive", stats?.inactive],
  ];
  return (
    <section aria-label="Enrollment summary" className="stats">
      {items.map(([label, value]) => (
        <div key={label} className="stat">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value ?? "—"}</span>
        </div>
      ))}
    </section>
  );
}
