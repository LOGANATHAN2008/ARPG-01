import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { Home, Menu, X, Phone } from "lucide-react"
export default function PublicNavbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-saffron flex items-center justify-center"><Home className="w-4 h-4 text-white"/></div><div><p className="font-bold text-sm font-display">Bangalore PG</p><p className="text-[10px] text-muted-foreground leading-none">Premium Accommodation</p></div></NavLink>
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Home</NavLink>
          <NavLink to="/rooms" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Available Rooms</NavLink>
          <NavLink to="/enquiry" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>Enquiry</NavLink>
          <a href="tel:+919876543210" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><Phone className="w-3.5 h-3.5"/>+91 98765 43210</a>
          <button onClick={() => navigate("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90">Tenant Login</button>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-accent">{open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {[{to:"/",l:"Home"},{to:"/rooms",l:"Available Rooms"},{to:"/enquiry",l:"Enquiry"}].map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({isActive}) => `block text-sm font-medium py-2 ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.l}</NavLink>
          ))}
          <button onClick={() => { setOpen(false); navigate("/login") }} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Tenant Login</button>
        </div>
      )}
    </header>
  )
}