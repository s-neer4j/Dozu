import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import theme from "./theme"
import "./App.css"

// --- Config ---
const API = "http://localhost:5000/api"
// theme.js or config file
// const API = "https://abcd1234.ngrok.io";

const LABEL_OPTIONS = ["High", "Bug", "Feature", "Enhancement", "Demo"]

export default function App() {
  const [boards, setBoards] = useState([])
  const [boardId, setBoardId] = useState(1)
  const [board, setBoard] = useState(null)
  const [taskInputs, setTaskInputs] = useState({})
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(null)
  const [creatingBoard, setCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")

  useEffect(() => { fetchBoards() }, [])
  useEffect(() => { if (boardId) fetchBoard(boardId) }, [boardId])

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${API}/boards`)
      setBoards(res.data)
      if (res.data.length && !boardId) setBoardId(res.data[0].id)
    } catch (e) { console.error("Boards load error:", e) }
  }
  const fetchBoard = async (id) => {
    try {
      const res = await axios.get(`${API}/boards/${id}`)
      setBoard(res.data)
    } catch (e) { console.error("Board load error:", e) }
  }

  const createBoard = async () => {
    if (!newBoardName.trim()) return
    try {
      const res = await axios.post(`${API}/boards`, { name: newBoardName.trim() })
      setCreatingBoard(false)
      setNewBoardName("")
      await fetchBoards()
      setBoardId(res.data.id)
    } catch (e) { console.error("Create board error:", e) }
  }

  const handleInputChange = (listId, field, value) => {
    setTaskInputs({ ...taskInputs, [listId]: { ...(taskInputs[listId] || {}), [field]: value } })
  }
  const toggleInputLabel = (listId, label) => {
    const current = taskInputs[listId]?.labels || []
    const next = current.includes(label) ? current.filter(l => l !== label) : [...current, label]
    handleInputChange(listId, "labels", next)
  }
  const addTask = async (listId) => {
    const inp = taskInputs[listId] || {}
    const title = inp.title?.trim()
    if (!title) return
    try {
      await axios.post(`${API}/boards/${boardId}/card`, {
        list_id: listId, title,
        due_date: inp.due_date || null,
        labels: inp.labels || [],
        description: inp.description || ""
      })
      setTaskInputs({ ...taskInputs, [listId]: {} })
      fetchBoard(boardId)
    } catch (e) { console.error("Add task error:", e) }
  }

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return
    try {
      await axios.post(`${API}/boards/${boardId}/move_card`, {
        card_id: parseInt(draggableId, 10),
        from_list: parseInt(source.droppableId, 10),
        to_list: parseInt(destination.droppableId, 10)
      })
      fetchBoard(boardId)
    } catch (e) { console.error("Move error:", e) }
  }

  const deleteCard = async (cardId) => {
    try {
      await axios.delete(`${API}/boards/${boardId}/card/${cardId}`)
      fetchBoard(boardId)
    } catch (e) { console.error("Delete error:", e) }
  }
  const saveCard = async (card) => {
    try {
      await axios.patch(`${API}/boards/${boardId}/card/${card.id}`, {
        title: card.title,
        due_date: card.due_date || null,
        labels: card.labels || [],
        description: card.description || ""
      })
      setModal(null)
      fetchBoard(boardId)
    } catch (e) { console.error("Update error:", e) }
  }

  const norm = (s) => (s || "").toLowerCase()
  const filteredBoard = useMemo(() => {
    if (!board) return null
    const q = norm(search)
    if (!q) return board
    const clone = JSON.parse(JSON.stringify(board))
    clone.lists.forEach(lst => {
      lst.cards = lst.cards.filter(c =>
        norm(c.title).includes(q) ||
        norm(c.description).includes(q) ||
        (c.labels || []).some(l => norm(l).includes(q))
      )
    })
    return clone
  }, [board, search])

  if (!boards.length) return <div style={{ padding: theme.spacing.xl }}>Loading boards…</div>

  return (
    <div style={{
      fontFamily: theme.font.family,
      background: theme.colors.light,
      minHeight: "100vh",
      color: theme.colors.dark
    }}>
      {/* Navbar */}
      <div style={{
        background: theme.colors.dark,
        color: theme.colors.white,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap"
      }}>
        <h2 style={{ margin: 0, fontWeight: theme.font.weight.bold }}>Dozu</h2>
        <select value={boardId} onChange={(e) => setBoardId(parseInt(e.target.value, 10))}
          style={{ padding: theme.spacing.sm, borderRadius: theme.radius.sm }}>
          {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button style={{
          background: theme.colors.accent, color: theme.colors.white,
          border: "none", padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          borderRadius: theme.radius.sm
        }} onClick={() => setCreatingBoard(true)}>New Board</button>
        <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 240, padding: theme.spacing.md, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.primary}`
          }} />
      </div>

      {/* Board */}
      {filteredBoard ? (
        <>
          <h3 style={{ textAlign: "center", margin: `${theme.spacing.lg} 0` }}>{filteredBoard.name}</h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start", overflowX: "auto" }}>
              {filteredBoard.lists.map((list) => (
                <Droppable droppableId={list.id.toString()} key={list.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      style={{
                        background: theme.colors.white, borderTop: `4px solid ${theme.colors.primary}`,
                        borderRadius: theme.radius.lg, padding: theme.spacing.lg,
                        minWidth: 260, minHeight: 220, boxShadow: theme.shadow.md
                      }}>
                      <h3 style={{ marginTop: 0, color: theme.colors.dark }}>{list.name}</h3>
                      {list.cards.map((card, idx) => {
                        const overdue = card.due_date && new Date(card.due_date) < new Date()
                        return (
                          <Draggable draggableId={card.id.toString()} index={idx} key={card.id}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                style={{
                                  background: theme.colors.white,
                                  borderLeft: `6px solid ${overdue ? theme.colors.danger : theme.colors.accent}`,
                                  padding: theme.spacing.lg, borderRadius: theme.radius.md,
                                  marginBottom: theme.spacing.md, boxShadow: theme.shadow.sm,
                                  ...provided.draggableProps.style
                                }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <strong>{card.title}</strong>
                                  <div style={{ display: "flex", gap: theme.spacing.sm }}>
                                    <button onClick={() => setModal({ listId: list.id, card: { ...card } })}>✏️</button>
                                    <button onClick={() => deleteCard(card.id)}>🗑️</button>
                                  </div>
                                </div>
                                {card.labels?.length > 0 && (
                                  <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", marginTop: theme.spacing.sm }}>
                                    {card.labels.map(l => (
                                      <span key={l} style={{
                                        fontSize: theme.font.size.sm,
                                        padding: "2px 6px", borderRadius: theme.radius.pill,
                                        background: theme.colors.light, color: theme.colors.dark
                                      }}>{l}</span>
                                    ))}
                                  </div>
                                )}
                                {card.due_date && (
                                  <div style={{
                                    fontSize: theme.font.size.sm, marginTop: theme.spacing.sm,
                                    color: overdue ? theme.colors.danger : theme.colors.primary
                                  }}>
                                    📅 {card.due_date}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {/* Add Task */}
                      <div style={{ marginTop: theme.spacing.md }}>
                        <input placeholder="New task title" value={taskInputs[list.id]?.title || ""}
                          onChange={(e) => handleInputChange(list.id, "title", e.target.value)}
                          style={{
                            width: "100%", padding: theme.spacing.md,
                            borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`
                          }} />
                        <input type="date" value={taskInputs[list.id]?.due_date || ""}
                          onChange={(e) => handleInputChange(list.id, "due_date", e.target.value)}
                          style={{
                            width: "100%", marginTop: theme.spacing.sm, padding: theme.spacing.md,
                            borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`
                          }} />
                        <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", marginTop: theme.spacing.sm }}>
                          {LABEL_OPTIONS.map(opt => {
                            const selected = (taskInputs[list.id]?.labels || []).includes(opt)
                            return (
                              <button key={opt} type="button" onClick={() => toggleInputLabel(list.id, opt)}
                                style={{
                                  fontSize: theme.font.size.sm, padding: "4px 8px", borderRadius: theme.radius.pill,
                                  border: selected ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                                  background: selected ? theme.colors.accent : theme.colors.gray,
                                  color: selected ? theme.colors.white : theme.colors.dark
                                }}>{opt}</button>
                            )
                          })}
                        </div>
                        <textarea placeholder="Description (optional)" value={taskInputs[list.id]?.description || ""}
                          onChange={(e) => handleInputChange(list.id, "description", e.target.value)}
                          style={{
                            width: "100%", marginTop: theme.spacing.sm, padding: theme.spacing.md,
                            borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`,
                            minHeight: 60
                          }} />
                        <button onClick={() => addTask(list.id)}
                          style={{
                            marginTop: theme.spacing.md, width: "100%",
                            background: theme.colors.primary, color: theme.colors.white,
                            border: "none", padding: theme.spacing.md, borderRadius: theme.radius.sm
                          }}>Add Task</button>
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </>
      ) : (<div>Loading…</div>)}

      {/* Create Board Modal */}
      {creatingBoard && (
        <Modal onClose={() => setCreatingBoard(false)}>
          <h3>Create New Board</h3>
          <input placeholder="Board name" value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            style={{
              width: "100%", padding: theme.spacing.md,
              borderRadius: theme.radius.sm, marginTop: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`
            }} />
          <div style={{ display: "flex", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <button onClick={createBoard}
              style={{
                background: theme.colors.accent, color: theme.colors.white,
                border: "none", padding: `${theme.spacing.sm} ${theme.spacing.md}`, borderRadius: theme.radius.sm
              }}>Create</button>
            <button onClick={() => setCreatingBoard(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <h3>Edit Task</h3>
          <input value={modal.card.title}
            onChange={(e) => setModal({ ...modal, card: { ...modal.card, title: e.target.value } })}
            style={{
              width: "100%", padding: theme.spacing.md,
              borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`
            }} />
          <input type="date" value={modal.card.due_date || ""}
            onChange={(e) => setModal({ ...modal, card: { ...modal.card, due_date: e.target.value } })}
            style={{
              width: "100%", padding: theme.spacing.md, marginTop: theme.spacing.sm,
              borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`
            }} />
          <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", marginTop: theme.spacing.sm }}>
            {LABEL_OPTIONS.map(opt => {
              const selected = (modal.card.labels || []).includes(opt)
              return (
                <label key={opt} style={{
                  fontSize: theme.font.size.md,
                  background: selected ? theme.colors.accent : theme.colors.gray,
                  padding: "6px 10px", borderRadius: theme.radius.pill,
                  color: selected ? theme.colors.white : theme.colors.dark
                }}>
                  <input type="checkbox" checked={selected} onChange={() => {
                    const current = modal.card.labels || []
                    const next = selected ? current.filter(l => l !== opt) : [...current, opt]
                    setModal({ ...modal, card: { ...modal.card, labels: next } })
                  }} style={{ marginRight: 6 }} />
                  {opt}
                </label>
              )
            })}
          </div>
          <textarea placeholder="Description" value={modal.card.description || ""}
            onChange={(e) => setModal({ ...modal, card: { ...modal.card, description: e.target.value } })}
            style={{
              width: "100%", minHeight: 120, padding: theme.spacing.md,
              borderRadius: theme.radius.sm, marginTop: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`
            }} />
          <div style={{ display: "flex", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <button onClick={() => saveCard(modal.card)}
              style={{
                background: theme.colors.primary, color: theme.colors.white,
                border: "none", padding: `${theme.spacing.sm} ${theme.spacing.md}`, borderRadius: theme.radius.sm
              }}>Save</button>
            <button onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)", background: theme.colors.white,
          padding: theme.spacing.xl, borderRadius: theme.radius.xl, boxShadow: theme.shadow.lg
        }}>
        {children}
      </div>
    </div>
  )
}
