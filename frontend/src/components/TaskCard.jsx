import { Draggable } from "@hello-pangea/dnd"

export default function TaskCard({ card, idx, onEdit, onDelete }) {
  const overdue = card.due_date && new Date(card.due_date) < new Date()

  return (
    <Draggable draggableId={card.id.toString()} index={idx} key={card.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: "#fff",
            borderLeft: `6px solid ${overdue ? "#ff6600" : "#00a8cc"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            ...provided.draggableProps.style
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{card.title}</strong>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onEdit(card)}>✏️</button>
              <button onClick={() => onDelete(card.id)}>🗑️</button>
            </div>
          </div>

          {card.labels?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {card.labels.map(l => (
                <span key={l} style={{
                  fontSize: 12, padding: "2px 6px",
                  borderRadius: 999, background: "#d9e8f5", color: "#003f54"
                }}>{l}</span>
              ))}
            </div>
          )}

          {card.due_date && (
            <div style={{
              fontSize: 12, marginTop: 6,
              color: overdue ? "#ff6600" : "#006699"
            }}>
              📅 {card.due_date}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
