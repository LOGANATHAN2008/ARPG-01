import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Edit, Users, Bed } from "lucide-react"
import { getRoom } from "@/services/roomService"
import { formatCurrency, getRoomStatusColor, titleCase } from "@/utils"
export default function RoomDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const { data: room, isLoading } = useQuery({ queryKey: ["room", id], queryFn: () => getRoom(id!), enabled: !!id })
  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
  if (!room) return <div className="text-center py-20 text-muted-foreground">Room not found</div>
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent"><ArrowLeft className="w-4 h-4"/></button>
        <div className="flex-1"><h1 className="page-title">Room {room.room_number}</h1><p className="page-subtitle capitalize">{room.room_type} · Floor {(room.floor as any)?.floor_number}</p></div>
        <button onClick={() => navigate(`/admin/rooms/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"><Edit className="w-4 h-4"/>Edit</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="pg-card p-6">
            <h2 className="font-semibold mb-4">Room Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[["Room Number", room.room_number],["Type", titleCase(room.room_type)],["Capacity", room.capacity],["Status", titleCase(room.status)],["Monthly Rent", formatCurrency(room.monthly_rent)],["Deposit", formatCurrency(room.deposit_amount)],["Maintenance", formatCurrency(room.maintenance_fee)],["Total Monthly", formatCurrency(room.total_monthly)],["Occupied Beds", room.occupied_beds],["Available Beds", room.available_beds]].map(([l,v]) => (
                <div key={l}><p className="text-muted-foreground">{l}</p><p className="font-semibold mt-0.5">{v}</p></div>
              ))}
            </div>
          </div>
          <div className="pg-card p-6">
            <h2 className="font-semibold mb-4">Beds</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(room.beds || []).map((bed: any) => (
                <div key={bed.id} className={`bed-dot bed-dot-${bed.status} flex flex-col items-center justify-center gap-0.5 h-20 rounded-xl`}>
                  <span className="text-lg font-bold">{bed.bed_label}</span>
                  <span className="text-[10px] capitalize">{bed.status}</span>
                  {bed.current_tenant && <span className="text-[9px] truncate max-w-[70px]">{bed.current_tenant.full_name.split(" ")[0]}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="pg-card p-5">
            <h3 className="font-semibold mb-3">Current Tenants</h3>
            {(room.beds || []).filter((b: any) => b.current_tenant).map((bed: any) => (
              <div key={bed.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{bed.current_tenant.full_name.charAt(0)}</div>
                <div><p className="font-medium text-sm">{bed.current_tenant.full_name}</p><p className="text-xs text-muted-foreground">Bed {bed.bed_label}</p></div>
              </div>
            ))}
            {!(room.beds || []).some((b: any) => b.current_tenant) && <p className="text-sm text-muted-foreground">No current tenants</p>}
          </div>
        </div>
      </div>
    </div>
  )
}