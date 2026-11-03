import { StudentsApp } from "@/components/StudentsApp";

export default function Page() {
  return (
    <main className="shell">
      <header className="top">
        <h1>Student enrollment</h1>
        <p>Register students, keep records accurate, and see enrollment at a glance.</p>
      </header>
      <StudentsApp />
    </main>
  );
}
