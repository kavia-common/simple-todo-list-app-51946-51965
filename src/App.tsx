import "./styles/app.css";

// PUBLIC_INTERFACE
export default function App() {
  /** Root application component (temporary landing screen). */
  return (
    <div className="app">
      <main className="card" role="main" aria-label="Todo List Web App">
        <h1 className="title">Todo List Web App</h1>
        <p className="subtitle">
          Scaffolding complete. Next: implement todo CRUD + localStorage
          persistence.
        </p>
      </main>
    </div>
  );
}
