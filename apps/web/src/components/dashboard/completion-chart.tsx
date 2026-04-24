'use client'

interface DataPoint {
  label: string
  value: number
}

interface CompletionChartProps {
  data: DataPoint[]
  title?: string
}

export function CompletionChart({ data, title = 'Completions' }: CompletionChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div>
      {title && (
        <p className="mb-4 text-sm font-semibold text-text-primary">{title}</p>
      )}
      <div className="flex items-end gap-2 h-32">
        {data.map((point, i) => {
          const height = Math.round((point.value / max) * 100)
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-text-muted">
                {point.value}
              </span>
              <div className="w-full flex items-end" style={{ height: 88 }}>
                <div
                  className="w-full rounded-t-[4px] bg-brand/80 hover:bg-brand transition-colors duration-150"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted">{point.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
