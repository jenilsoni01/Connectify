const TypingIndicator = ({ label }) => {
  if (!label) return null
  return (
    <div className="text-xs text-[var(--muted)]">
      {label} is typing...
    </div>
  )
}

export default TypingIndicator
