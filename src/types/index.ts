// ─────────────────────────────────────────────────────────
//  ENUMS
// ─────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'tenant'

export type PropertyStatus = 'active' | 'inactive' | 'maintenance'

export type RoomStatus = 'available' | 'partially_occupied' | 'full' | 'maintenance' | 'reserved' | 'blocked'

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked'

export type TenantStatus = 'active' | 'notice_period' | 'checked_out' | 'suspended' | 'pending_verification'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled' | 'void'

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'cancelled' | 'manually_verified'

export type PaymentMethod = 'upi' | 'google_pay' | 'phonepe' | 'paytm' | 'razorpay' | 'bank_transfer' | 'cash' | 'cheque' | 'other'

export type PaymentGateway = 'razorpay' | 'manual' | 'none'

export type ComplaintStatus = 'submitted' | 'acknowledged' | 'assigned' | 'in_progress' | 'waiting_for_parts' | 'resolved' | 'reopened' | 'closed' | 'rejected'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'

export type ComplaintCategory = 'electricity' | 'water' | 'plumbing' | 'ac' | 'fan' | 'wifi' | 'cleaning' | 'bathroom' | 'furniture' | 'food' | 'security' | 'maintenance' | 'roommate' | 'other'

export type MaintenanceStatus = 'open' | 'in_progress' | 'waiting_for_parts' | 'completed' | 'cancelled'

export type AnnouncementTarget = 'all' | 'property' | 'floor' | 'room'

export type NotificationType = 'payment_success' | 'payment_failed' | 'payment_reminder' | 'complaint_update' | 'complaint_new' | 'announcement' | 'maintenance' | 'tenant_added' | 'tenant_checkout' | 'invoice_generated' | 'overdue_rent' | 'system'

export type DocumentType = 'agreement' | 'id_proof' | 'address_proof' | 'police_verification' | 'receipt' | 'invoice' | 'other'

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'food' | 'laundry' | 'maintenance' | 'other'

export type ChargeType = 'fixed' | 'per_tenant' | 'per_room' | 'meter_based'

export type IdProofType = 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id' | 'other'

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment_verify' | 'status_change' | 'assign' | 'export' | 'import'

// ─────────────────────────────────────────────────────────
//  BASE
// ─────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────
//  USERS & PROFILES
// ─────────────────────────────────────────────────────────

export interface UserProfile extends BaseEntity {
  user_id: string
  role: UserRole
  full_name: string
  phone: string
  whatsapp_number?: string
  email: string
  avatar_url?: string
  is_active: boolean
  last_login?: string
  fcm_token?: string
}

// ─────────────────────────────────────────────────────────
//  PROPERTIES
// ─────────────────────────────────────────────────────────

export interface Property extends BaseEntity {
  name: string
  code: string
  address: string
  area: string
  city: string
  state: string
  pincode: string
  google_maps_url?: string
  latitude?: number
  longitude?: number
  contact_number: string
  whatsapp_number: string
  email: string
  description?: string
  rules?: string
  check_in_info?: string
  check_out_info?: string
  deposit_info?: string
  rent_cycle_day: number // day of month rent is due
  status: PropertyStatus
  images: string[] // Cloudinary URLs
  cover_image?: string
  total_rooms?: number
  total_beds?: number
  occupied_beds?: number
  available_beds?: number
  occupancy_percent?: number
}

// ─────────────────────────────────────────────────────────
//  BUILDINGS
// ─────────────────────────────────────────────────────────

export interface Building extends BaseEntity {
  property_id: string
  name: string
  code: string
  total_floors: number
  description?: string
  property?: Property
}

// ─────────────────────────────────────────────────────────
//  FLOORS
// ─────────────────────────────────────────────────────────

export interface Floor extends BaseEntity {
  building_id: string
  property_id: string
  floor_number: number
  name: string
  total_rooms: number
  building?: Building
  property?: Property
}

// ─────────────────────────────────────────────────────────
//  ROOMS
// ─────────────────────────────────────────────────────────

export interface Room extends BaseEntity {
  floor_id: string
  building_id: string
  property_id: string
  room_number: string
  room_type: string // 'single' | 'double' | 'triple' | 'dormitory' | 'private'
  capacity: number
  monthly_rent: number
  deposit_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  total_monthly: number
  total_beds: number
  available_beds: number
  occupied_beds: number
  status: RoomStatus
  description?: string
  images: string[]
  amenities: string[]
  floor?: Floor
  building?: Building
  property?: Property
  beds?: Bed[]
}

// ─────────────────────────────────────────────────────────
//  BEDS
// ─────────────────────────────────────────────────────────

export interface Bed extends BaseEntity {
  room_id: string
  floor_id: string
  building_id: string
  property_id: string
  bed_label: string // A, B, C, D
  status: BedStatus
  current_tenant_id?: string
  room?: Room
  current_tenant?: Tenant
}

// ─────────────────────────────────────────────────────────
//  TENANTS
// ─────────────────────────────────────────────────────────

export interface Tenant extends BaseEntity {
  user_id?: string
  full_name: string
  profile_photo?: string
  date_of_birth?: string
  gender: 'male' | 'female' | 'other'
  phone: string
  whatsapp_number?: string
  email: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  permanent_address?: string
  id_proof_type?: IdProofType
  id_proof_number?: string
  id_document_url?: string
  joining_date: string
  expected_checkout_date?: string
  actual_checkout_date?: string
  property_id: string
  building_id?: string
  floor_id?: string
  room_id?: string
  bed_id?: string
  monthly_rent: number
  deposit_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  payment_due_day: number
  status: TenantStatus
  notes?: string
  property?: Property
  room?: Room
  bed?: Bed
  current_invoice?: Invoice
  pending_amount?: number
}

// ─────────────────────────────────────────────────────────
//  ROOM ASSIGNMENTS (history)
// ─────────────────────────────────────────────────────────

export interface RoomAssignment extends BaseEntity {
  tenant_id: string
  property_id: string
  room_id: string
  bed_id: string
  assigned_date: string
  vacated_date?: string
  is_current: boolean
  notes?: string
  tenant?: Tenant
  room?: Room
  bed?: Bed
}

// ─────────────────────────────────────────────────────────
//  RENT PLANS
// ─────────────────────────────────────────────────────────

export interface RentPlan extends BaseEntity {
  tenant_id: string
  property_id: string
  room_id: string
  monthly_rent: number
  deposit_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  total_monthly: number
  grace_period_days: number
  late_fee_per_day: number
  max_late_fee: number
  effective_from: string
  effective_to?: string
  is_active: boolean
}

// ─────────────────────────────────────────────────────────
//  INVOICES
// ─────────────────────────────────────────────────────────

export interface Invoice extends BaseEntity {
  invoice_number: string
  tenant_id: string
  property_id: string
  room_id: string
  bed_id?: string
  billing_period_start: string
  billing_period_end: string
  due_date: string
  rent_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  late_fee: number
  discount: number
  subtotal: number
  total_amount: number
  paid_amount: number
  balance_due: number
  status: InvoiceStatus
  notes?: string
  pdf_url?: string
  generated_by?: string
  tenant?: Tenant
  property?: Property
  room?: Room
  payments?: Payment[]
}

// ─────────────────────────────────────────────────────────
//  PAYMENTS
// ─────────────────────────────────────────────────────────

export interface Payment extends BaseEntity {
  payment_reference: string
  tenant_id: string
  property_id: string
  room_id: string
  invoice_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  gateway: PaymentGateway
  gateway_order_id?: string
  gateway_payment_id?: string
  gateway_signature?: string
  upi_reference?: string
  status: PaymentStatus
  paid_at?: string
  verified_at?: string
  verification_source?: 'webhook' | 'manual' | 'reconciliation'
  verified_by?: string
  failure_reason?: string
  notes?: string
  tenant?: Tenant
  invoice?: Invoice
}

// ─────────────────────────────────────────────────────────
//  COMPLAINTS
// ─────────────────────────────────────────────────────────

export interface Complaint extends BaseEntity {
  complaint_number: string
  tenant_id: string
  property_id: string
  room_id?: string
  category: ComplaintCategory
  title: string
  description: string
  priority: ComplaintPriority
  status: ComplaintStatus
  images: string[]
  assigned_staff_id?: string
  admin_notes?: string
  resolution?: string
  resolved_at?: string
  closed_at?: string
  tenant?: Tenant
  property?: Property
  room?: Room
  assigned_staff?: Staff
  activity?: ComplaintActivity[]
}

export interface ComplaintActivity extends BaseEntity {
  complaint_id: string
  actor_id: string
  actor_name: string
  actor_role: UserRole
  action: string
  old_status?: ComplaintStatus
  new_status?: ComplaintStatus
  notes?: string
}

// ─────────────────────────────────────────────────────────
//  MAINTENANCE
// ─────────────────────────────────────────────────────────

export interface MaintenanceTask extends BaseEntity {
  task_number: string
  complaint_id?: string
  property_id: string
  room_id?: string
  title: string
  description: string
  priority: ComplaintPriority
  status: MaintenanceStatus
  assigned_staff_id?: string
  estimated_cost?: number
  actual_cost?: number
  scheduled_date?: string
  completed_date?: string
  images: string[]
  notes?: string
  assigned_staff?: Staff
}

// ─────────────────────────────────────────────────────────
//  STAFF
// ─────────────────────────────────────────────────────────

export interface Staff extends BaseEntity {
  user_id?: string
  full_name: string
  phone: string
  email?: string
  role: string // 'plumber' | 'electrician' | 'cleaner' | 'security' | 'manager' | etc.
  department?: string
  property_id?: string
  is_active: boolean
  avatar_url?: string
}

// ─────────────────────────────────────────────────────────
//  AMENITIES
// ─────────────────────────────────────────────────────────

export interface Amenity extends BaseEntity {
  name: string
  icon?: string
  image_url?: string
  category: string
  description?: string
  is_active: boolean
  display_order: number
}

export interface PropertyAmenity extends BaseEntity {
  property_id: string
  amenity_id: string
  is_available: boolean
  notes?: string
  amenity?: Amenity
}

// ─────────────────────────────────────────────────────────
//  ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────

export interface Announcement extends BaseEntity {
  title: string
  content: string
  target: AnnouncementTarget
  property_id?: string
  floor_id?: string
  room_id?: string
  is_pinned: boolean
  is_active: boolean
  published_at: string
  expires_at?: string
  created_by: string
  images: string[]
  priority: 'normal' | 'important' | 'urgent'
}

// ─────────────────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  user_id: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, string>
  is_read: boolean
  read_at?: string
  action_url?: string
}

// ─────────────────────────────────────────────────────────
//  UTILITY READINGS
// ─────────────────────────────────────────────────────────

export interface UtilityReading extends BaseEntity {
  room_id: string
  property_id: string
  utility_type: UtilityType
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit: number
  total_amount: number
  reading_date: string
  recorded_by: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────
//  SECURITY DEPOSITS
// ─────────────────────────────────────────────────────────

export interface SecurityDeposit extends BaseEntity {
  tenant_id: string
  property_id: string
  room_id: string
  amount: number
  paid_date: string
  payment_method: PaymentMethod
  payment_reference?: string
  refundable_amount: number
  deductions: number
  deduction_reasons?: string
  refund_date?: string
  refund_reference?: string
  status: 'held' | 'partially_refunded' | 'refunded' | 'forfeited'
}

// ─────────────────────────────────────────────────────────
//  CHECKOUT SETTLEMENT
// ─────────────────────────────────────────────────────────

export interface CheckoutSettlement extends BaseEntity {
  tenant_id: string
  property_id: string
  room_id: string
  bed_id: string
  checkout_date: string
  final_meter_reading?: number
  pending_rent: number
  electricity_charges: number
  damage_charges: number
  other_deductions: number
  total_deductions: number
  deposit_amount: number
  refundable_amount: number
  settlement_date?: string
  settlement_reference?: string
  notes?: string
  status: 'pending' | 'settled' | 'disputed'
}

// ─────────────────────────────────────────────────────────
//  AUDIT LOGS
// ─────────────────────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  actor_id: string
  actor_name: string
  actor_role: UserRole
  action: AuditAction
  resource_type: string
  resource_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  notes?: string
}

// ─────────────────────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────────────────────

export interface AppSettings {
  // Branding
  pg_name: string
  pg_tagline: string
  pg_logo_url?: string
  pg_favicon_url?: string
  pg_primary_color: string
  // Contact
  contact_phone: string
  contact_whatsapp: string
  contact_email: string
  contact_address: string
  website_url?: string
  // Invoice
  invoice_prefix: string
  invoice_footer_text?: string
  invoice_logo_url?: string
  tax_enabled: boolean
  tax_rate: number
  tax_label: string
  // Payment
  razorpay_enabled: boolean
  upi_id?: string
  // WhatsApp Business
  whatsapp_business_enabled: boolean
  // Notifications
  rent_reminder_days: number[] // [7, 3, 1, 0]
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  // Late fee
  default_grace_period_days: number
  default_late_fee_per_day: number
  default_max_late_fee: number
  // General
  currency: string
  timezone: string
  date_format: string
  landlord_name: string
  landlord_signature_url?: string
}

// ─────────────────────────────────────────────────────────
//  MEDIA
// ─────────────────────────────────────────────────────────

export interface Media extends BaseEntity {
  resource_type: string
  resource_id: string
  url: string
  public_id: string
  type: 'image' | 'video' | 'document'
  format: string
  size: number
  width?: number
  height?: number
  alt?: string
  uploaded_by: string
}

// ─────────────────────────────────────────────────────────
//  ENQUIRIES
// ─────────────────────────────────────────────────────────

export interface Enquiry extends BaseEntity {
  name: string
  phone: string
  email?: string
  preferred_room_type?: string
  move_in_date?: string
  message?: string
  property_id?: string
  status: 'new' | 'contacted' | 'converted' | 'rejected' | 'archived'
  notes?: string
  followed_up_by?: string
  followed_up_at?: string
}

// ─────────────────────────────────────────────────────────
//  DASHBOARD STATS
// ─────────────────────────────────────────────────────────

export interface DashboardStats {
  total_properties: number
  total_buildings: number
  total_floors: number
  total_rooms: number
  total_beds: number
  occupied_beds: number
  available_beds: number
  reserved_beds: number
  maintenance_beds: number
  occupancy_percent: number
  total_tenants: number
  active_tenants: number
  pending_tenants: number
  notice_period_tenants: number
  monthly_expected_revenue: number
  monthly_collected_revenue: number
  monthly_pending_revenue: number
  monthly_overdue_revenue: number
  today_revenue: number
  open_complaints: number
  high_priority_complaints: number
  in_progress_complaints: number
  resolved_today: number
  pending_invoices: number
  overdue_invoices: number
  new_enquiries: number
}

// ─────────────────────────────────────────────────────────
//  API RESPONSES
// ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// ─────────────────────────────────────────────────────────
//  FORM TYPES
// ─────────────────────────────────────────────────────────

export interface CreateTenantForm {
  full_name: string
  email: string
  phone: string
  whatsapp_number?: string
  gender: 'male' | 'female' | 'other'
  date_of_birth?: string
  permanent_address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  id_proof_type?: IdProofType
  id_proof_number?: string
  joining_date: string
  expected_checkout_date?: string
  property_id: string
  building_id?: string
  floor_id?: string
  room_id?: string
  bed_id?: string
  monthly_rent: number
  deposit_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  payment_due_day: number
  notes?: string
}

export interface CreateInvoiceForm {
  tenant_id: string
  billing_period_start: string
  billing_period_end: string
  due_date: string
  rent_amount: number
  maintenance_fee: number
  electricity_fee: number
  water_fee: number
  other_charges: number
  late_fee: number
  discount: number
  notes?: string
}

export interface RaiseComplaintForm {
  category: ComplaintCategory
  title: string
  description: string
  priority: ComplaintPriority
  images?: File[]
}

// ─────────────────────────────────────────────────────────
//  REALTIME EVENTS
// ─────────────────────────────────────────────────────────

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: Partial<T>
  schema: string
  table: string
}
