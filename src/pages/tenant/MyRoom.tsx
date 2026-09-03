import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { getTenantByUserId } from "@/services/tenantService"
import { getRoommates } from "@/services/tenantService"
import { formatDate, formatCurrency, avatarFallback } from "@/utils"
import { DoorOpen, Users, IndianRupee, Calendar, Bed } from "lucide-react"
export default function TenantRoom() {
  const { profile } = useAuth()
  const { data: tenant, isLoading } = useQuery({ queryKey: ["my-tenant", profile?.user_id], queryFn: () => getTenantByUserId(profile!.user_id), enabled: !!profile?.user_id })
  const { data: roommates = [] } = useQuery({ queryKey: ["roommates", tenant?.room_id, tenant?.id], queryFn: () => getRoommates(tenant!.room_id!, tenant!.id), enabled: !!tenant?.room_id })
  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
  if (!tenant) return <div className="text-center py-20 text-muted-foreground">No room assigned yet. Contact admin.</div>
  const room = tenant.room as any
  const bed = tenant.bed as any
  return (
    <div className="space-y-5">
      <h1 className="page-title">My Room</h1>
      <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3"><div className="p-2.5 bg-white/20 rounded-xl"><DoorOpen className="w-6 h-6"/></div><div><h2 className="text-2xl font-bold font-display">Room {room?.room_number}</h2><p className="text-white/70 text-sm capitalize">{room?.room_type} room · {room?.floor?.name}</p></div></div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[{l:"Bed",v:`Bed ${bed?.bed_label||"—"}`},{l:"Rent",v:formatCurrency(tenant.monthly_rent)},{l:"Joining",v:formatDate(tenant.joining_date)},{l:"Deposit",v:formatCurrency(tenant.deposit_amount)}].map(item => <div key={item.l} className="glass-card p-3"><p className="text-white/60 text-xs">{item.l}</p><p className="text-white font-bold text-sm mt-0.5">{item.v}</p></div>)}
        </div>
      </div>
      <div className="pg-card p-5">
        <h2 className="font-semibold mb-4">Room Beds</h2>
        <div className="grid grid-cols-4 gap-2">
          {(room?.beds || []).map((b: any) => (
            <div key={b.id} className={`bed-dot bed-dot-${b.status} flex flex-col items-center justify-center h-20 rounded-xl`}>
              <span className="text-xl font-bold">{b.bed_label}</span>
              {b.current_tenant?.id === tenant.id && <span className="text-[9px]">You</span>}
              {b.current_tenant && b.current_tenant.id !== tenant.id && <span className="text-[9px] truncate max-w-[60px]">{b.current_tenant.full_name.split(" ")[0]}</span>}
            </div>
          ))}
        </div>
      </div>
      {roommates.length > 0 && (
        <div className="pg-card p-5">
          <h2 className="font-semibold mb-3">Roommates</h2>
          <div className="space-y-3">
            {roommates.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden flex-shrink-0">{r.profile_photo ? <img src={r.profile_photo} className="w-full h-full object-cover"/> : avatarFallback(r.full_name)}</div>
                <div><p className="font-medium text-sm">{r.full_name}</p><p className="text-xs text-muted-foreground">Joined {formatDate(r.joining_date)}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}