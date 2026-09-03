import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { CreditCard, Download, RefreshCw, Eye } from "lucide-react"
import { getPayments } from "@/services/paymentService"
import { formatDate, formatDateTime, formatCurrency, getPaymentStatusColor, titleCase, csvExport } from "@/utils"
export default function Payments() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: payments = [], isLoading, refetch } = useQuery({ queryKey: ["payments", statusFilter], queryFn: () => getPayments({ status: statusFilter !== "all" ? statusFilter as any : undefined }) })
  const handleExport = () => csvExport(payments.map(p => ({ "Payment Ref": p.payment_reference, Tenant: (p.tenant as any)?.full_name, Amount: p.amount, Method: p.payment_method, Gateway: p.gateway, Status: p.status, "Paid At": formatDateTime(p.paid_at || ""), "Transaction ID": p.gateway_payment_id || "" })), `payments-${new Date().toISOString().split("T")[0]}.csv`)
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Payments</h1><p className="page-subtitle">{payments.length} payment records</p></div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-accent"><Download className="w-4 h-4"/>Export</button>
          <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><RefreshCw className="w-4 h-4"/></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["all","success","manually_verified","pending","failed","refunded"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s === "all" ? "All" : titleCase(s)}</button>)}
      </div>
      <div className="pg-card overflow-hidden">
        <table className="w-full data-table">
          <thead><tr><th>Payment Ref</th><th>Tenant</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid At</th><th>Transaction ID</th></tr></thead>
          <tbody>
            {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:7}).map((_,j) => <td key={j}><div className="shimmer h-4 rounded"/></td>)}</tr>)
            : payments.length === 0 ? <tr><td colSpan={7} className="py-16 text-center"><div className="flex flex-col items-center gap-3"><CreditCard className="w-10 h-10 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">No payments yet</p></div></td></tr>
            : payments.map(p => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td><span className="font-mono text-xs text-muted-foreground">{p.payment_reference}</span></td>
                <td><p className="text-sm font-medium">{(p.tenant as any)?.full_name}</p><p className="text-xs text-muted-foreground">{(p.tenant as any)?.phone}</p></td>
                <td><span className="font-bold text-sm">{formatCurrency(p.amount)}</span></td>
                <td><span className="text-sm capitalize">{p.payment_method.replace("_"," ")}</span></td>
                <td><span className={`badge ${getPaymentStatusColor(p.status)}`}>{titleCase(p.status)}</span></td>
                <td><span className="text-xs">{p.paid_at ? formatDateTime(p.paid_at) : "—"}</span></td>
                <td><span className="font-mono text-xs text-muted-foreground">{p.gateway_payment_id || "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}