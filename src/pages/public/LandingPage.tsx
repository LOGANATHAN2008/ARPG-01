import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Home, Phone, MapPin, Star, Wifi, Shield, Zap,
  Droplets, Tv2, Car, ChevronRight, MessageCircle,
  Users, BedDouble, Building2, IndianRupee, Check
} from 'lucide-react'

const AMENITIES = [
  { icon: Wifi, label: 'High Speed Wi-Fi', desc: '100 Mbps Fiber' },
  { icon: Shield, label: '24/7 Security', desc: 'CCTV + Guard' },
  { icon: Zap, label: 'Power Backup', desc: 'Inverter / Generator' },
  { icon: Droplets, label: 'Hot Water', desc: 'Solar + Electric' },
  { icon: Tv2, label: 'Common TV', desc: 'Entertainment Lounge' },
  { icon: Car, label: 'Parking', desc: 'Bike & Car' },
]

const PROPERTIES = [
  {
    name: 'Koramangala Elite PG',
    area: 'Koramangala, 6th Block',
    type: 'Co-ed',
    from: 8500,
    occupancy: 82,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
  },
  {
    name: 'HSR Layout Premium PG',
    area: 'HSR Layout, Sector 2',
    type: 'Co-ed',
    from: 9500,
    occupancy: 90,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  },
  {
    name: 'Indiranagar Boys PG',
    area: '100 Feet Road, Indiranagar',
    type: 'Boys Only',
    from: 9000,
    occupancy: 75,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&q=80',
  },
]

const TESTIMONIALS = [
  { name: 'Rahul Singh', role: 'Software Engineer, Amazon', text: 'The best PG experience in Bangalore. Great amenities, responsive management and a home-like atmosphere. Highly recommended!', rating: 5 },
  { name: 'Priya Menon', role: 'Data Analyst, Deloitte', text: 'Clean rooms, fast WiFi, and the admin team resolves complaints within hours. The online payment system is very convenient.', rating: 5 },
  { name: 'Karthik Reddy', role: 'Product Manager, Flipkart', text: 'Transparent billing, no hidden charges. The WhatsApp bill sharing is a great feature. I have been here for 2 years!', rating: 5 },
]

const PLANS = [
  { type: 'Triple Sharing', price: 8500, features: ['Attached Wardrobe', 'Study Table', 'Wi-Fi Included', 'CCTV Security', 'Laundry Service'] },
  { type: 'Double Sharing', price: 10000, popular: true, features: ['Attached Wardrobe', 'Study Table', 'Wi-Fi Included', 'CCTV Security', 'Laundry Service', 'More Privacy'] },
  { type: 'Single Room', price: 15000, features: ['Full Private Room', 'Attached Bathroom', 'Wi-Fi Included', 'CCTV Security', 'Priority Support', 'Premium Amenities'] },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient relative overflow-hidden py-20 md:py-32">
        {/* Background circles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${100 + i * 60}px`,
              height: `${100 + i * 60}px`,
              right: `-${30 + i * 20}px`,
              top: `${10 + i * 15}%`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Premium PG Accommodation in Bangalore
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display leading-tight mb-6">
              Your Home Away<br />From Home in<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
                Bangalore
              </span>
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto mb-8">
              Fully furnished PG rooms in Koramangala, HSR Layout & Indiranagar. 
              Starting from just ₹8,500/month with all amenities included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/rooms')}
                className="px-8 py-4 bg-white text-brand-700 rounded-2xl font-bold text-lg hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg"
              >
                View Available Rooms
              </button>
              <button
                onClick={() => navigate('/enquiry')}
                className="px-8 py-4 bg-white/10 backdrop-blur text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                Send Enquiry
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { icon: Building2, label: '3 Locations', desc: 'Koramangala, HSR, Indiranagar' },
              { icon: BedDouble, label: '200+ Beds', desc: 'Various room types' },
              { icon: Users, label: '100+ Tenants', desc: 'Happy residents' },
              { icon: Star, label: '4.8★ Rating', desc: 'Average review score' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 text-white text-center">
                <s.icon className="w-6 h-6 mx-auto mb-2 text-amber-300" />
                <p className="font-bold">{s.label}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Properties */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black font-display text-foreground mb-4">
              Our PG Locations
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Premium PG accommodation in the most sought-after areas of Bangalore, close to IT parks and metro stations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROPERTIES.map((property, i) => (
              <motion.div
                key={property.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="pg-card overflow-hidden group cursor-pointer"
                onClick={() => navigate('/rooms')}
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-full">
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-full">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {property.rating}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {property.name}
                  </h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {property.area}
                  </p>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Occupancy</span>
                      <span>{property.occupancy}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${property.occupancy}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Starting from</span>
                      <p className="font-bold text-lg text-foreground">
                        ₹{property.from.toLocaleString('en-IN')}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <button className="flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-20 bg-muted/30 bg-mesh">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black font-display text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              All amenities included in your monthly rent. No hidden charges.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {AMENITIES.map((amenity, i) => (
              <motion.div
                key={amenity.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="pg-card p-5 text-center group hover:border-primary/30 transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <amenity.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-foreground">{amenity.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{amenity.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black font-display text-foreground mb-4">
              Transparent Pricing
            </h2>
            <p className="text-muted-foreground">No hidden charges. All amenities included.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`pg-card p-6 relative ${plan.popular ? 'border-primary shadow-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="font-bold text-lg text-foreground mb-2">{plan.type}</h3>
                <div className="mb-5">
                  <span className="text-4xl font-black font-display text-foreground">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/enquiry')}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border hover:bg-accent text-foreground'
                  }`}
                >
                  Book Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-black font-display text-foreground mb-4">What Our Tenants Say</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="pg-card p-6"
              >
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero-gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto px-4 text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-black font-display mb-4">
            Ready to Move In?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Contact us today for a free site visit. Available 7 days a week, 9 AM – 8 PM.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-700 rounded-2xl font-bold hover:bg-white/95 transition-colors"
            >
              <Phone className="w-5 h-5" /> Call Now
            </a>
            <a
              href="https://wa.me/919876543210?text=Hi%2C+I+am+interested+in+your+PG+rooms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </a>
            <button
              onClick={() => navigate('/enquiry')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              Send Enquiry
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
