export function StudentTable({ students, editingId, onEdit, onDelete }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Phone</th>
            <th scope="col">Course</th>
            <th scope="col">Enrolled</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className={s.id === editingId ? "editing" : undefined}>
              <td>
                <strong>{s.full_name}</strong>
                <br />
                <span className="muted">{s.email}</span>
              </td>
              <td>{s.phone_number}</td>
              <td>{s.course}</td>
              <td>{s.enrollment_date}</td>
              <td>
                <span className={`badge ${s.status === "Active" ? "on" : "off"}`}>{s.status}</span>
              </td>
              <td className="actions">
                <button type="button" className="btn secondary" onClick={() => onEdit(s)} aria-label={`Edit ${s.full_name}`}>
                  Edit
                </button>
                <button type="button" className="btn danger-outline" onClick={() => onDelete(s)} aria-label={`Delete ${s.full_name}`}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
