import { DragDropContext } from "@hello-pangea/dnd"
import List from "./List"

export default function Board({ board, taskInputs, handleInputChange, toggleInputLabel, addTask, onDragEnd, setModal, deleteCard }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start", overflowX: "auto" }}>
        {board.lists.map((list) => (
          <List
            key={list.id}
            list={list}
            taskInputs={taskInputs}
            handleInputChange={handleInputChange}
            toggleInputLabel={toggleInputLabel}
            addTask={addTask}
            setModal={setModal}
            deleteCard={deleteCard}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
