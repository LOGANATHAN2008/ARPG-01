import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { getComplaint } from "@/services/complaintService"
import { getComplaintStatusColor, getPriorityColor, titleCase, formatDateTime } from "@/utils"
export default function TenantComplaintDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const { data: complaint, isLoading } = useQuery({ queryKey: ["complaint", id], queryFn: () => getComplaint(id!), enabled: !!id })
  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
  if (!complaint) return <div className="text-center py-20 text-muted-foreground">Complaint not found</div>
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent"><ArrowLeft className="w-4 h-4"/></button><h1 className="page-title">Complaint</h1></div>
      <div className="pg-card p-5">
        <div className="flex items-start justify-between mb-3"><span className="font-mono text-xs text-muted-foreground">{complaint.complaint_number}</span><span className={`badge ${getComplaintStatusColor(complaint.status)}`}>{titleCase(complaint.status)}</span></div>
        <h2 className="font-bold text-lg text-foreground mb-2">{complaint.title}</h2>
        <p className="text-sm text-muted-foreground mb-3">{complaint.description}</p>
        <div className="flex gap-2"><span className={`badge ${getPriorityColor(complaint.priority)} capitalize`}>{complaint.priority}</span><span className="badge bg-muted border-border text-muted-foreground capitalize">{complaint.category}</span></div>
      </div>
      {complaint.admin_notes && <div className="pg-card p-5 bg-blue-50 border-blue-200"><h3 className="font-semibold text-blue-900 mb-1 text-sm">Admin Response</h3><p className="text-blue-800 text-sm">{complaint.admin_notes}</p></div>}
      {((complaint as any).activity || []).length > 0 && (
        <div className="pg-card p-5">
          <h3 className="font-semibold mb-3">Activity Timeline</h3>
          <div className="space-y-3">
            {((complaint as any).activity || []).map((a: any) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"/>
                <div><p className="font-medium text-foreground">{a.action}</p>{a.notes && <p className="text-muted-foreground text-xs">{a.notes}</p>}<p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(a.created_at)} · {a.actor_name}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}