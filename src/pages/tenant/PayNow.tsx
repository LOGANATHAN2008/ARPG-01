import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, CreditCard, Smartphone, IndianRupee, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getTenantByUserId } from "@/services/tenantService"
import { getInvoice } from "@/services/invoiceService"
import { formatCurrency } from "@/utils"
import toast from "react-hot-toast"
export default function PayNow() {
  const { profile } = useAuth(); const navigate = useNavigate(); const [params] = useSearchParams()
  const invoiceId = params.get("invoice")
  const [method, setMethod] = useState("upi")
  const [upiRef, setUpiRef] = useState("")
  const [loading, setLoading] = useState(false)
  const { data: tenant } = useQuery({ queryKey: ["my-tenant", profile?.user_id], queryFn: () => getTenantByUserId(profile!.user_id), enabled: !!profile?.user_id })
  const { data: invoice } = useQuery({ queryKey: ["invoice", invoiceId], queryFn: () => getInvoice(invoiceId!), enabled: !!invoiceId })
  const amount = invoice ? Number(invoice.balance_due) : (tenant?.monthly_rent || 0)
  const handlePay = async () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); toast.success("Payment initiated! You will receive a confirmation shortly."); navigate("/portal/payments") }, 1500)
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent"><ArrowLeft className="w-4 h-4"/></button><h1 className="page-title">Pay Rent</h1></div>
      <div className="pg-card p-5">
        <h2 className="font-semibold mb-4">Payment Amount</h2>
        <div className="text-4xl font-bold font-display text-foreground mb-1">{formatCurrency(amount)}</div>
        {invoice && <p className="text-sm text-muted-foreground font-mono">{invoice.invoice_number}</p>}
      </div>
      <div className="pg-card p-5">
        <h2 className="font-semibold mb-4">Payment Method</h2>
        <div className="space-y-3">
          {[{key:"upi",label:"UPI / GPay / PhonePe",icon:"📱"},{key:"razorpay",label:"Card / Net Banking",icon:"💳"},{key:"bank_transfer",label:"Bank Transfer / NEFT",icon:"🏦"}].map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${method === m.key ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}>
              <span className="text-2xl">{m.icon}</span>
              <span className="font-medium text-sm">{m.label}</span>
              {method === m.key && <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white"/></div>}
            </button>
          ))}
        </div>
      </div>
      {method === "upi" && (
        <div className="pg-card p-5">
          <h2 className="font-semibold mb-3">UPI Payment</h2>
          <div className="flex items-center justify-center p-6 bg-muted rounded-xl mb-4">
            <div className="text-center"><div className="w-32 h-32 bg-foreground/10 rounded-xl flex items-center justify-center mx-auto mb-2"><span className="text-4xl">📱</span></div><p className="text-sm font-medium">UPI ID: bangalorepg@upi</p><p className="text-xs text-muted-foreground mt-1">Scan QR or send to above ID</p></div>
          </div>
          <input type="text" placeholder="Enter UPI transaction reference number" value={upiRef} onChange={e => setUpiRef(e.target.value)} className="form-input"/>
        </div>
      )}
      <button onClick={handlePay} disabled={loading || (method === "upi" && !upiRef)} className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin"/>Processing…</> : `Pay ${formatCurrency(amount)}`}
      </button>
      <p className="text-center text-xs text-muted-foreground">Payments are processed securely. You will receive a receipt via WhatsApp.</p>
    </div>
  )
}