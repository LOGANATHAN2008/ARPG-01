import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, FileText, Download, Eye, RefreshCw } from "lucide-react"
import { getInvoices } from "@/services/invoiceService"
import { formatDate, formatCurrency, getInvoiceStatusColor, titleCase, csvExport } from "@/utils"
export default function Invoices() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: invoices = [], isLoading, refetch } = useQuery({ queryKey: ["invoices", statusFilter], queryFn: () => getInvoices({ status: statusFilter !== "all" ? statusFilter as any : undefined }) })
  const handleExport = () => csvExport(invoices.map(i => ({ "Invoice #": i.invoice_number, Tenant: (i.tenant as any)?.full_name, Room: (i.room as any)?.room_number, Amount: i.total_amount, Paid: i.paid_amount, Balance: i.balance_due, Status: i.status, "Due Date": formatDate(i.due_date) })), `invoices-${new Date().toISOString().split("T")[0]}.csv`)
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Invoices</h1><p className="page-subtitle">{invoices.length} invoices</p></div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-accent"><Download className="w-4 h-4"/>Export</button>
          <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={() => navigate("/admin/invoices/new")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>Generate Invoice</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["all","pending","paid","overdue","partially_paid","draft"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s === "all" ? "All" : titleCase(s)}</button>)}
      </div>
      <div className="pg-card overflow-hidden">
        <table className="w-full data-table">
          <thead><tr><th>Invoice #</th><th>Tenant</th><th>Room</th><th>Period</th><th>Amount</th><th>Due Date</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-4 rounded"/></td>)}</tr>)
            : invoices.length === 0 ? <tr><td colSpan={8} className="py-16 text-center"><div className="flex flex-col items-center gap-3"><FileText className="w-10 h-10 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">No invoices found</p></div></td></tr>
            : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                <td><span className="font-mono text-sm font-medium text-primary">{inv.invoice_number}</span></td>
                <td><div><p className="text-sm font-medium">{(inv.tenant as any)?.full_name}</p><p className="text-xs text-muted-foreground">{(inv.tenant as any)?.phone}</p></div></td>
                <td><span className="text-sm">Room {(inv.room as any)?.room_number}</span></td>
                <td><span className="text-xs text-muted-foreground">{formatDate(inv.billing_period_start)}</span></td>
                <td><span className="font-semibold text-sm">{formatCurrency(inv.total_amount)}</span></td>
                <td><span className={`text-sm ${new Date(inv.due_date) < new Date() && inv.status !== "paid" ? "text-red-600 font-medium" : ""}`}>{formatDate(inv.due_date)}</span></td>
                <td><span className={`badge ${getInvoiceStatusColor(inv.status)}`}>{titleCase(inv.status)}</span></td>
                <td className="text-right"><button onClick={e => {e.stopPropagation(); navigate(`/admin/invoices/${inv.id}`)}} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><Eye className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}