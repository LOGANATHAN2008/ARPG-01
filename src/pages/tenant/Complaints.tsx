import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getTenantByUserId } from "@/services/tenantService"
import { getComplaints } from "@/services/complaintService"
import { formatDateTime, getComplaintStatusColor, getPriorityColor, titleCase } from "@/utils"
export default function TenantComplaints() {
  const { profile } = useAuth(); const navigate = useNavigate()
  const { data: tenant } = useQuery({ queryKey: ["my-tenant", profile?.user_id], queryFn: () => getTenantByUserId(profile!.user_id), enabled: !!profile?.user_id })
  const { data: complaints = [], isLoading } = useQuery({ queryKey: ["my-complaints", tenant?.id], queryFn: () => getComplaints({ tenant_id: tenant!.id }), enabled: !!tenant?.id })
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="page-title">My Complaints</h1><button onClick={() => navigate("/portal/complaints/new")} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"><Plus className="w-4 h-4"/>Raise Issue</button></div>
      {isLoading ? Array.from({length:3}).map((_,i) => <div key={i} className="pg-card p-4 space-y-2"><div className="shimmer h-5 w-3/4 rounded"/><div className="shimmer h-4 rounded"/></div>)
      : complaints.length === 0 ? <div className="text-center py-16"><MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">No complaints raised yet</p><button onClick={() => navigate("/portal/complaints/new")} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Raise an Issue</button></div>
      : complaints.map(c => (
        <button key={c.id} onClick={() => navigate(`/portal/complaints/${c.id}`)} className="w-full text-left pg-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-start justify-between mb-2"><span className="font-mono text-xs text-muted-foreground">{c.complaint_number}</span><span className={`badge ${getComplaintStatusColor(c.status)}`}>{titleCase(c.status)}</span></div>
          <p className="font-semibold text-sm text-foreground mb-1">{c.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
          <div className="flex items-center justify-between"><span className={`badge ${getPriorityColor(c.priority)} text-xs capitalize`}>{c.priority}</span><span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span></div>
        </button>
      ))}
    </div>
  )
}