interface PaginationProps {
  current: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(current - 1)} disabled={current === 1}>
        Previous
      </button>
      <span>Page {current} of {total}</span>
      <button onClick={() => onChange(current + 1)} disabled={current === total}>
        Next
      </button>
    </div>
  )
}
