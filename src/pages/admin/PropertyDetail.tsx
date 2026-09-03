import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Building2 } from 'lucide-react'
import { getProperty } from '@/services/propertyService'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }
  if (!property) {
    return <div className="text-center py-20 text-muted-foreground">Property not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{property.name}</h1>
          <p className="page-subtitle">{property.code} · {property.area}, {property.city}</p>
        </div>
        <button
          onClick={() => navigate(`/admin/properties/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
        >
          <Edit className="w-4 h-4" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 pg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Property Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Address', property.address],
              ['Pincode', property.pincode],
              ['Contact', property.contact_number],
              ['Email', property.email || '—'],
              ['Rent Due Day', `${property.rent_cycle_day}th of every month`],
              ['Status', property.status],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
          {property.description && (
            <div>
              <h3 className="font-medium text-foreground mb-1">Description</h3>
              <p className="text-sm text-muted-foreground">{property.description}</p>
            </div>
          )}
          {property.rules && (
            <div>
              <h3 className="font-medium text-foreground mb-1">Rules</h3>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{property.rules}</pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="pg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { label: 'View Rooms', to: `/admin/rooms?property=${id}` },
                { label: 'View Tenants', to: `/admin/tenants?property=${id}` },
                { label: 'View Invoices', to: `/admin/invoices?property=${id}` },
                { label: 'View Complaints', to: `/admin/complaints?property=${id}` },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {action.label} →
                </button>
              ))}
            </div>
          </div>

          {property.images && property.images.length > 0 && (
            <div className="pg-card p-5">
              <h3 className="font-semibold text-foreground mb-3">Gallery</h3>
              <div className="grid grid-cols-2 gap-2">
                {property.images.slice(0, 4).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Property ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
