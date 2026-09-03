import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Search, Filter, BedDouble, MapPin } from "lucide-react"
import { getRooms } from "@/services/roomService"
import { getProperties } from "@/services/propertyService"
import { formatCurrency, getRoomStatusColor, titleCase } from "@/utils"
export default function RoomsAvailability() {
  const navigate = useNavigate()
  const [propertyId, setPropertyId] = useState("all")
  const [type, setType] = useState("all")
  const { data: rooms = [], isLoading } = useQuery({ queryKey: ["public-rooms", propertyId, type], queryFn: () => getRooms({ property_id: propertyId !== "all" ? propertyId : undefined, room_type: type !== "all" ? type : undefined }) })
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: () => getProperties() })
  const available = rooms.filter(r => r.status !== "blocked" && r.status !== "maintenance")
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10"><h1 className="text-4xl font-black font-display text-foreground mb-4">Available Rooms</h1><p className="text-muted-foreground">Find your perfect room across our Bangalore PG locations.</p></div>
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="form-input max-w-[200px]"><option value="all">All Locations</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={type} onChange={e => setType(e.target.value)} className="form-input max-w-[150px]"><option value="all">All Types</option><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option></select>
      </div>
      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i) => <div key={i} className="pg-card overflow-hidden"><div className="shimmer h-40"/><div className="p-4 space-y-2"><div className="shimmer h-4 w-3/4 rounded"/><div className="shimmer h-4 w-1/2 rounded"/></div></div>)}</div>
      : available.length === 0 ? <div className="text-center py-20 text-muted-foreground"><BedDouble className="w-12 h-12 mx-auto mb-4 opacity-30"/><p>No rooms match your filters.</p></div>
      : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {available.map(room => (
          <div key={room.id} className="pg-card overflow-hidden group cursor-pointer" onClick={() => navigate("/enquiry")}>
            <div className="h-36 bg-gradient-to-br from-brand-600 to-brand-900 relative flex items-center justify-center"><BedDouble className="w-10 h-10 text-white/30"/><div className="absolute top-3 right-3"><span className={`badge ${getRoomStatusColor(room.status)}`}>{room.available_beds} beds available</span></div></div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1"><MapPin className="w-3.5 h-3.5 text-muted-foreground"/><span className="text-sm text-muted-foreground">{(room.property as any)?.name}</span></div>
              <h3 className="font-bold text-foreground">Room {room.room_number} – {titleCase(room.room_type)}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Floor {(room.floor as any)?.floor_number} · {room.total_beds} bed{room.total_beds !== 1 ? "s" : ""}</p>
              <div className="flex items-center justify-between mt-3"><p className="text-xl font-black text-foreground">{formatCurrency(room.monthly_rent)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p><button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90">Enquire</button></div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  )
}