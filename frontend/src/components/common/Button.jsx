const variants = {
  primary: 'bg-[var(--accent)] text-white hover:brightness-110',
  ghost: 'bg-transparent text-[var(--ink)] hover:bg-black/5',
  soft: 'bg-black/5 text-[var(--ink)] hover:bg-black/10'
}

const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
        variants[variant] || variants.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
