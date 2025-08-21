export default function Navbar({ boards, boardId, setBoardId, search, setSearch, onNewBoard }) {
  return (
    <div style={{
      background: "#003f54", color: "white", padding: "12px 20px",
      display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap"
    }}>
      <h2 style={{ margin: 0, fontWeight: 700 }}>Dozu</h2>

      <select value={boardId} onChange={(e) => setBoardId(parseInt(e.target.value, 10))}
        style={{ padding: 6, borderRadius: 6 }}>
        {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <button
        style={{ background: "#00a8cc", color: "white", border: "none", padding: "6px 12px", borderRadius: 6 }}
        onClick={onNewBoard}
      >
        + New Board
      </button>

      <input
        placeholder="Search tasks…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ flex: 1, minWidth: 240, padding: 8, borderRadius: 8, border: "1px solid #006699" }}
      />
    </div>
  )
}
