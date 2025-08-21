import { Droppable } from "@hello-pangea/dnd"
import TaskCard from "./TaskCard"
import TaskForm from "./TaskForm"

export default function List({ list, taskInputs, handleInputChange, toggleInputLabel, addTask, setModal, deleteCard }) {
  return (
    <Droppable droppableId={list.id.toString()} key={list.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            background: "white",
            borderTop: "4px solid #006699",
            borderRadius: 10,
            padding: 12,
            minWidth: 260,
            minHeight: 220,
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
          }}
        >
          <h3 style={{ marginTop: 0, color: "#003f54" }}>{list.name}</h3>

          {list.cards.map((card, idx) => (
            <TaskCard
              key={card.id}
              card={card}
              idx={idx}
              onEdit={(c) => setModal({ listId: list.id, card: { ...c } })}
              onDelete={deleteCard}
            />
          ))}
          {provided.placeholder}

          <TaskForm
            listId={list.id}
            inputs={taskInputs[list.id]}
            onChange={handleInputChange}
            onToggleLabel={toggleInputLabel}
            onAddTask={addTask}
          />
        </div>
      )}
    </Droppable>
  )
}
