export default function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          background: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
        }}
      >
        {children}
      </div>
    </div>
  )
}
