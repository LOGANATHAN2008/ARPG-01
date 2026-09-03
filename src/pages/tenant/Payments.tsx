import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { CreditCard, Plus, Download } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getTenantByUserId } from "@/services/tenantService"
import { getInvoices } from "@/services/invoiceService"
import { formatDate, formatCurrency, getInvoiceStatusColor, titleCase, csvExport } from "@/utils"
export default function TenantPayments() {
  const { profile } = useAuth(); const navigate = useNavigate()
  const { data: tenant } = useQuery({ queryKey: ["my-tenant", profile?.user_id], queryFn: () => getTenantByUserId(profile!.user_id), enabled: !!profile?.user_id })
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["my-invoices", tenant?.id], queryFn: () => getInvoices({ tenant_id: tenant!.id }), enabled: !!tenant?.id })
  const pendingTotal = invoices.filter(i => ["pending","overdue","partially_paid"].includes(i.status)).reduce((sum,i) => sum + Number(i.balance_due), 0)
  return (
    <div className="space-y-5">
      <div className="page-header"><h1 className="page-title">Payments</h1></div>
      {pendingTotal > 0 && (
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm">Total Outstanding</p>
          <p className="text-3xl font-bold font-display mt-1">{formatCurrency(pendingTotal)}</p>
          <button onClick={() => navigate("/portal/payments/pay")} className="mt-3 px-5 py-2 bg-white text-brand-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors">Pay Now →</button>
        </div>
      )}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Invoice History</h2>
        {isLoading ? Array.from({length:4}).map((_,i) => <div key={i} className="pg-card p-4 space-y-2"><div className="shimmer h-5 w-1/2 rounded"/><div className="shimmer h-4 w-full rounded"/></div>)
        : invoices.length === 0 ? <div className="text-center py-12 text-muted-foreground"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30"/><p>No invoices yet</p></div>
        : invoices.map(inv => (
          <div key={inv.id} className="pg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div><p className="font-semibold text-sm">{formatDate(inv.billing_period_start)}</p><p className="text-xs text-muted-foreground font-mono">{inv.invoice_number}</p></div>
              <span className={`badge ${getInvoiceStatusColor(inv.status)}`}>{titleCase(inv.status)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm"><span className="text-muted-foreground">Total: </span><span className="font-bold">{formatCurrency(inv.total_amount)}</span></div>
              {inv.balance_due > 0 && <div className="text-sm text-red-600 font-bold">Due: {formatCurrency(inv.balance_due)}</div>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Due: {formatDate(inv.due_date)}</p>
            {["pending","overdue","partially_paid"].includes(inv.status) && (
              <button onClick={() => navigate(`/portal/payments/pay?invoice=${inv.id}`)} className="mt-3 w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">Pay {formatCurrency(inv.balance_due)}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}