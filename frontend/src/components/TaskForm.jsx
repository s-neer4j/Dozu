const LABEL_OPTIONS = ["High", "Bug", "Feature", "Enhancement", "Demo"]

export default function TaskForm({ listId, inputs, onChange, onToggleLabel, onAddTask }) {
  return (
    <div style={{ marginTop: 8 }}>
      <input
        placeholder="New task title"
        value={inputs?.title || ""}
        onChange={(e) => onChange(listId, "title", e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
      />

      <input
        type="date"
        value={inputs?.due_date || ""}
        onChange={(e) => onChange(listId, "due_date", e.target.value)}
        style={{ width: "100%", marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
      />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        {LABEL_OPTIONS.map(opt => {
          const selected = (inputs?.labels || []).includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggleLabel(listId, opt)}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: selected ? "2px solid #006699" : "1px solid #ccc",
                background: selected ? "#00a8cc" : "#f0f0f0",
                color: selected ? "white" : "#003f54"
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      <textarea
        placeholder="Description (optional)"
        value={inputs?.description || ""}
        onChange={(e) => onChange(listId, "description", e.target.value)}
        style={{
          width: "100%", marginTop: 6, padding: 8,
          borderRadius: 6, border: "1px solid #ccc", minHeight: 60
        }}
      />

      <button
        onClick={() => onAddTask(listId)}
        style={{
          marginTop: 8, width: "100%",
          background: "#006699", color: "white",
          border: "none", padding: "8px", borderRadius: 6
        }}
      >
        + Add Task
      </button>
    </div>
  )
}
