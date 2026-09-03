import { Phone, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
export default function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <motion.a initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} href="https://wa.me/919876543210?text=Hi%2C+I+am+interested+in+your+PG" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all" title="WhatsApp">
        <MessageCircle className="w-6 h-6 text-white"/>
      </motion.a>
      <motion.a initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} href="tel:+919876543210" className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:scale-110 transition-all" title="Call Us">
        <Phone className="w-6 h-6 text-white"/>
      </motion.a>
    </div>
  )
}