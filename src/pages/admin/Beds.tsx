import { useQuery } from "@tanstack/react-query"
import { Bed } from "lucide-react"
import { getAvailableBeds } from "@/services/roomService"
import { formatCurrency } from "@/utils"
export default function Beds() {
  const { data: beds = [], isLoading } = useQuery({ queryKey: ["available-beds"], queryFn: () => getAvailableBeds() })
  return (
    <div className="space-y-6">
      <div className="page-header"><div><h1 className="page-title">Beds</h1><p className="page-subtitle">{beds.length} available beds</p></div></div>
      {isLoading ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i) => <div key={i} className="pg-card p-4 space-y-2"><div className="shimmer h-12 rounded"/><div className="shimmer h-4 w-2/3 rounded"/></div>)}</div>
      : beds.length === 0 ? <div className="text-center py-20 text-muted-foreground">No available beds at this time.</div>
      : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{beds.map(bed => <div key={bed.id} className="pg-card p-4"><div className="bed-dot bed-dot-available w-full h-16 rounded-xl mb-3 text-2xl font-bold">{bed.bed_label}</div><p className="text-sm font-medium">Room {(bed.room as any)?.room_number}</p><p className="text-xs text-muted-foreground capitalize">{(bed.room as any)?.room_type}</p><p className="text-xs font-semibold text-primary mt-1">{formatCurrency((bed.room as any)?.monthly_rent || 0)}/mo</p></div>)}</div>}
    </div>
  )
}