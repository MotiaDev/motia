import { Input } from '@motiadev/ui'
import { CircleX, Search } from 'lucide-react'

type EndpointsSearchProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export const EndpointsSearch = ({ value, onChange, onClear }: EndpointsSearchProps) => {
  return (
    <div className="p-2 border-b gap-4" data-testid="endpoints-search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          variant="shade"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 pr-10 font-medium"
        />
        <CircleX
          className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground"
          onClick={onClear}
        />
      </div>
    </div>
  )
}
