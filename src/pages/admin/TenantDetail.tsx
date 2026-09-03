import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Edit, Phone, Mail, LogOut } from "lucide-react"
import { getTenant } from "@/services/tenantService"
import { getInvoices } from "@/services/invoiceService"
import { getComplaints } from "@/services/complaintService"
import { formatDate, formatCurrency, getTenantStatusColor, titleCase, avatarFallback } from "@/utils"

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => getTenant(id!),
    enabled: !!id,
  })
  const { data: invoices = [] } = useQuery({
    queryKey: ["tenant-invoices", id],
    queryFn: () => getInvoices({ tenant_id: id }),
    enabled: !!id,
  })
  const { data: complaints = [] } = useQuery({
    queryKey: ["tenant-complaints", id],
    queryFn: () => getComplaints({ tenant_id: id }),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
  if (!tenant) return <div className="text-center py-20 text-muted-foreground">Tenant not found</div>

  const totalPending = invoices.filter(i => ["pending","overdue","partially_paid"].includes(i.status)).reduce((s,i) => s + Number(i.balance_due), 0)
  const room = tenant.room as any
  const bed = tenant.bed as any
  const property = tenant.property as any

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent"><ArrowLeft className="w-4 h-4"/></button>
        <div className="flex-1"><h1 className="page-title">{tenant.full_name}</h1><p className="page-subtitle capitalize">{tenant.status} Tenant</p></div>
        <button onClick={() => navigate(`/admin/tenants/${id}/checkout`)} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-accent"><LogOut className="w-4 h-4"/>Checkout</button>
        <button onClick={() => navigate(`/admin/tenants/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"><Edit className="w-4 h-4"/>Edit</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="pg-card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden flex-shrink-0">
                {tenant.profile_photo ? <img src={tenant.profile_photo} className="w-full h-full object-cover"/> : avatarFallback(tenant.full_name)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{tenant.full_name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/>{tenant.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5"/>{tenant.email}</span>
                </div>
                <span className={`badge mt-2 ${getTenantStatusColor(tenant.status)}`}>{titleCase(tenant.status)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ["Joining Date", formatDate(tenant.joining_date)],
                ["Monthly Rent", formatCurrency(tenant.monthly_rent)],
                ["Deposit Paid", formatCurrency(tenant.deposit_amount)],
                ["Maintenance", formatCurrency(tenant.maintenance_fee)],
                ["Gender", titleCase(tenant.gender)],
                ["Due Day", `${tenant.payment_due_day}th`],
              ].map(([l,v]) => (
                <div key={l}><p className="text-muted-foreground">{l}</p><p className="font-semibold mt-0.5">{v}</p></div>
              ))}
            </div>
          </div>
          <div className="pg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Room Assignment</h3>
              <button onClick={() => navigate(`/admin/rooms/${tenant.room_id}`)} className="text-xs text-primary">View Room →</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Property", property?.name || "—"],
                ["Room", "Room " + (room?.room_number || "—")],
                ["Floor", room?.floor?.name || "—"],
                ["Bed", "Bed " + (bed?.bed_label || "—")],
                ["Room Type", titleCase(room?.room_type || "—")],
              ].map(([l,v]) => (
                <div key={l}><p className="text-muted-foreground">{l}</p><p className="font-semibold mt-0.5">{v}</p></div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="pg-card p-5">
            <h3 className="font-semibold mb-3">Financial Summary</h3>
            <div className="space-y-3">
              {[
                ["Total Invoices", invoices.length],
                ["Paid", invoices.filter(i => i.status === "paid").length],
                ["Pending", invoices.filter(i => ["pending","overdue","partially_paid"].includes(i.status)).length],
                ["Outstanding", formatCurrency(totalPending)],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{l}</span>
                  <span className={`font-semibold ${l === "Outstanding" && totalPending > 0 ? "text-red-600" : ""}`}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(`/admin/invoices/new?tenant=${id}`)} className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
              Generate Invoice
            </button>
          </div>
          <div className="pg-card p-5">
            <h3 className="font-semibold mb-3">Complaint Summary</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Total", complaints.length],
                ["Open", complaints.filter(c => ["submitted","acknowledged","in_progress","assigned"].includes(c.status)).length],
                ["Resolved", complaints.filter(c => c.status === "resolved").length],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pg-card p-5">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            {[
              { l: "View Invoices", to: `/admin/invoices?tenant=${id}` },
              { l: "View Complaints", to: `/admin/complaints?tenant=${id}` },
              { l: "Generate Invoice", to: `/admin/invoices/new?tenant=${id}` },
            ].map(a => (
              <button key={a.l} onClick={() => navigate(a.to)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-foreground">
                {a.l} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
