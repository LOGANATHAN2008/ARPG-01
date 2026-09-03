import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notificationService"
import { formatDateTime } from "@/utils"
export default function TenantNotices() {
  const { profile } = useAuth(); const queryClient = useQueryClient()
  const { data: notifications = [], isLoading } = useQuery({ queryKey: ["my-notifications", profile?.user_id], queryFn: () => getNotifications(profile!.user_id, 50), enabled: !!profile?.user_id })
  const markAllMutation = useMutation({ mutationFn: () => markAllAsRead(profile!.user_id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-notifications"] }) })
  const markOneMutation = useMutation({ mutationFn: (id: string) => markAsRead(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-notifications"] }) })
  const unread = notifications.filter(n => !n.is_read).length
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Notices</h1>{unread > 0 && <p className="page-subtitle">{unread} unread</p>}</div>
        {unread > 0 && <button onClick={() => markAllMutation.mutate()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-sm hover:bg-accent"><CheckCheck className="w-4 h-4"/>Mark all read</button>}
      </div>
      {isLoading ? Array.from({length:4}).map((_,i) => <div key={i} className="pg-card p-4 space-y-2"><div className="shimmer h-5 w-3/4 rounded"/><div className="shimmer h-4 rounded"/></div>)
      : notifications.length === 0 ? <div className="text-center py-16"><Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">No notices yet</p></div>
      : notifications.map(n => (
        <button key={n.id} onClick={() => !n.is_read && markOneMutation.mutate(n.id)} className={`w-full text-left pg-card p-4 transition-all ${!n.is_read ? "border-primary/30 bg-blue-50/30" : ""}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${!n.is_read ? "bg-blue-100" : "bg-muted"}`}><Bell className={`w-4 h-4 ${!n.is_read ? "text-blue-600" : "text-muted-foreground"}`}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5"><p className={`font-semibold text-sm ${!n.is_read ? "text-blue-900" : "text-foreground"}`}>{n.title}</p>{!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>}</div>
              <p className="text-xs text-muted-foreground mb-1">{n.body}</p>
              <p className="text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}