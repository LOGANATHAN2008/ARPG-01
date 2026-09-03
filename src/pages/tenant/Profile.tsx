import { useAuth } from "@/contexts/AuthContext"
import { LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
export default function TenantProfile() {
  const { profile, signOut } = useAuth(); const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate("/login") }
  return (
    <div className="space-y-5">
      <h1 className="page-title">My Profile</h1>
      <div className="pg-card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mx-auto mb-3">{profile?.full_name?.charAt(0)||"T"}</div>
        <h2 className="text-xl font-bold font-display text-foreground">{profile?.full_name}</h2>
        <p className="text-muted-foreground text-sm">{profile?.email}</p>
        <span className="badge badge-active mt-2">Active Tenant</span>
      </div>
      <div className="pg-card p-5 space-y-3">
        {[{l:"Full Name",v:profile?.full_name||"—"},{l:"Email",v:profile?.email||"—"},{l:"Role",v:profile?.role||"—"}].map(item => (
          <div key={item.l} className="flex items-center justify-between py-2 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{item.l}</span><span className="text-sm font-medium capitalize">{item.v}</span></div>
        ))}
      </div>
      <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4"/>Sign Out</button>
    </div>
  )
}