import { Home, Phone, Mail, MapPin } from "lucide-react"
export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div><div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-saffron flex items-center justify-center"><Home className="w-4 h-4 text-white"/></div><span className="font-bold text-white font-display">Bangalore PG</span></div><p className="text-sm text-gray-400">Premium PG accommodation in Bangalore with all modern amenities.</p></div>
        <div><h3 className="font-semibold text-white mb-4">Locations</h3><ul className="space-y-2 text-sm">{["Koramangala – 6th Block","HSR Layout – Sector 2","Indiranagar – 100 Feet Rd"].map(l => <li key={l} className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-400"/>{l}</li>)}</ul></div>
        <div><h3 className="font-semibold text-white mb-4">Quick Links</h3><ul className="space-y-2 text-sm">{[{l:"Available Rooms",h:"/rooms"},{l:"Send Enquiry",h:"/enquiry"},{l:"Tenant Login",h:"/login"},{l:"Admin Panel",h:"/admin"}].map(i => <li key={i.l}><a href={i.h} className="hover:text-white transition-colors">{i.l}</a></li>)}</ul></div>
        <div><h3 className="font-semibold text-white mb-4">Contact</h3><ul className="space-y-2 text-sm">{[{icon:Phone,text:"+91 98765 43210"},{icon:Mail,text:"info@bangalorepg.com"}].map(c => <li key={c.text} className="flex items-center gap-2"><c.icon className="w-4 h-4"/>{c.text}</li>)}</ul></div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">© {new Date().getFullYear()} Bangalore PG Management Platform. All rights reserved.</div>
    </footer>
  )
}