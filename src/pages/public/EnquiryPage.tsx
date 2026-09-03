import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { MessageCircle, Phone, Loader2 } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import toast from "react-hot-toast"
const schema = z.object({ name: z.string().min(2,"Name required"), phone: z.string().min(10,"Phone required"), email: z.string().email("Valid email required"), preferred_area: z.string().optional(), room_type: z.string().optional(), budget: z.string().optional(), move_in_date: z.string().optional(), message: z.string().optional() })
type F = z.infer<typeof schema>
export default function EnquiryPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: async (data: F) => {
      await addDoc(collection(db, "enquiries"), { name: data.name, phone: data.phone, email: data.email, preferred_area: data.preferred_area, room_type_preference: data.room_type, budget_min: data.budget ? Number(data.budget) : undefined, move_in_date: data.move_in_date, message: data.message, source: "website", status: 'new', is_deleted: false, created_at: new Date().toISOString() })
    },
    onSuccess: () => { toast.success("Enquiry submitted! We will call you within 24 hours."); reset() },
    onError: () => toast.error("Failed to submit. Please try WhatsApp instead."),
  })
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10"><h1 className="text-4xl font-black font-display text-foreground mb-4">Send an Enquiry</h1><p className="text-muted-foreground">Fill in your details and we will get back to you within 24 hours.</p></div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="pg-card p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="form-label">Full Name *</label><input {...register("name")} className="form-input mt-1" placeholder="Your name"/>{errors.name && <p className="form-error">{errors.name.message}</p>}</div>
            <div><label className="form-label">Phone *</label><input {...register("phone")} className="form-input mt-1" placeholder="9876543210"/>{errors.phone && <p className="form-error">{errors.phone.message}</p>}</div>
            <div><label className="form-label">Email *</label><input {...register("email")} type="email" className="form-input mt-1" placeholder="your@email.com"/>{errors.email && <p className="form-error">{errors.email.message}</p>}</div>
            <div><label className="form-label">Preferred Area</label><select {...register("preferred_area")} className="form-input mt-1"><option value="">Any area</option><option>Koramangala</option><option>HSR Layout</option><option>Indiranagar</option></select></div>
            <div><label className="form-label">Room Type</label><select {...register("room_type")} className="form-input mt-1"><option value="">Any type</option><option value="single">Single</option><option value="double">Double Sharing</option><option value="triple">Triple Sharing</option></select></div>
            <div><label className="form-label">Budget (monthly)</label><select {...register("budget")} className="form-input mt-1"><option value="">Any budget</option><option value="8500">Upto 9,000</option><option value="10000">Upto 11,000</option><option value="12000">Upto 13,000</option><option value="15000">Upto 15,000+</option></select></div>
            <div><label className="form-label">Move-in Date</label><input {...register("move_in_date")} type="date" className="form-input mt-1"/></div>
          </div>
          <div><label className="form-label">Message</label><textarea {...register("message")} rows={3} className="form-input mt-1" placeholder="Any specific requirements..."/></div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">{isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin"/>Submitting…</> : "Submit Enquiry"}</button>
        </form>
        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm mb-3">Prefer direct contact?</p>
          <div className="flex gap-3 justify-center">
            <a href="tel:+919876543210" className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:bg-accent text-sm font-medium"><Phone className="w-4 h-4"/>Call Now</a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600"><MessageCircle className="w-4 h-4"/>WhatsApp</a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}