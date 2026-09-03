// ─────────────────────────────────────────────────────────
//  Currency Formatters (INR)
// ─────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount}`
}

// ─────────────────────────────────────────────────────────
//  Date Formatters (Indian format)
// ─────────────────────────────────────────────────────────

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
}

export function formatMonthYear(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

export function getDaysDiff(from: string, to: string = new Date().toISOString()): number {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

export function daysUntilDue(dueDate: string): number {
  const diff = new Date(dueDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getMonthStart(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

export function getMonthEnd(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
}

export function getBillingPeriod(month?: Date): { start: string; end: string; label: string } {
  const d = month || new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  }
}

// ─────────────────────────────────────────────────────────
//  String Helpers
// ─────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function titleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function generateInvoiceNumber(prefix: string, sequence: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`
}

export function generateComplaintNumber(sequence: number): string {
  return `CMP-${String(sequence).padStart(5, '0')}`
}

export function generatePaymentReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 5).toUpperCase()
  return `PAY-${timestamp}-${random}`
}

// ─────────────────────────────────────────────────────────
//  Phone / WhatsApp
// ─────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function getWhatsAppPaymentMessage(params: {
  tenantName: string
  roomNumber: string
  amount: number
  invoiceNumber: string
  paymentDate: string
  invoiceUrl?: string
}): string {
  return `Hello ${params.tenantName},

Your rent payment for *Room ${params.roomNumber}* has been received successfully! ✅

*Amount Paid:* ${formatCurrency(params.amount)}
*Invoice No:* ${params.invoiceNumber}
*Payment Date:* ${params.paymentDate}

${params.invoiceUrl ? `📄 Download your receipt here:\n${params.invoiceUrl}` : ''}

Thank you for the timely payment! 🙏

_— Bangalore Premium PG Management_`
}

export function getWhatsAppRentReminderMessage(params: {
  tenantName: string
  roomNumber: string
  amount: number
  dueDate: string
  upiId?: string
}): string {
  return `Hello ${params.tenantName},

This is a friendly reminder that your rent for *Room ${params.roomNumber}* is due.

*Amount Due:* ${formatCurrency(params.amount)}
*Due Date:* ${params.dueDate}

${params.upiId ? `💳 Pay via UPI: ${params.upiId}` : ''}

Please pay before the due date to avoid late fees.

_— Bangalore Premium PG Management_`
}

// ─────────────────────────────────────────────────────────
//  Status helpers
// ─────────────────────────────────────────────────────────

export function getBedStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    occupied: 'text-blue-500 bg-blue-50 border-blue-200',
    reserved: 'text-purple-500 bg-purple-50 border-purple-200',
    maintenance: 'text-gray-500 bg-gray-50 border-gray-200',
    blocked: 'text-red-500 bg-red-50 border-red-200',
  }
  return colors[status] || 'text-gray-500 bg-gray-50 border-gray-200'
}

export function getRoomStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    partially_occupied: 'text-amber-600 bg-amber-50 border-amber-200',
    full: 'text-blue-600 bg-blue-50 border-blue-200',
    maintenance: 'text-gray-600 bg-gray-50 border-gray-200',
    reserved: 'text-purple-600 bg-purple-50 border-purple-200',
    blocked: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    manually_verified: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    processing: 'text-blue-600 bg-blue-50 border-blue-200',
    failed: 'text-red-600 bg-red-50 border-red-200',
    cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    refunded: 'text-purple-600 bg-purple-50 border-purple-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    overdue: 'text-red-600 bg-red-50 border-red-200',
    partially_paid: 'text-blue-600 bg-blue-50 border-blue-200',
    draft: 'text-gray-600 bg-gray-50 border-gray-200',
    cancelled: 'text-gray-500 bg-gray-50 border-gray-200',
    void: 'text-gray-500 bg-gray-50 border-gray-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getComplaintStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'text-blue-600 bg-blue-50 border-blue-200',
    acknowledged: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    assigned: 'text-purple-600 bg-purple-50 border-purple-200',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-200',
    waiting_for_parts: 'text-orange-600 bg-orange-50 border-orange-200',
    resolved: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    reopened: 'text-red-600 bg-red-50 border-red-200',
    closed: 'text-gray-600 bg-gray-50 border-gray-200',
    rejected: 'text-red-700 bg-red-50 border-red-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-gray-600 bg-gray-50 border-gray-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getTenantStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    notice_period: 'text-amber-600 bg-amber-50 border-amber-200',
    checked_out: 'text-gray-600 bg-gray-50 border-gray-200',
    suspended: 'text-red-600 bg-red-50 border-red-200',
    pending_verification: 'text-blue-600 bg-blue-50 border-blue-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

// ─────────────────────────────────────────────────────────
//  Misc
// ─────────────────────────────────────────────────────────

export function calculateOccupancy(occupied: number, total: number): number {
  if (!total) return 0
  return Math.round((occupied / total) * 100)
}

export function calculateLateFee(
  daysLate: number,
  feePerDay: number,
  maxFee: number
): number {
  return Math.min(daysLate * feePerDay, maxFee)
}

export function getCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'placeholder'
  const { width, height, quality = 80, format = 'auto' } = options
  const transforms = [
    `q_${quality}`,
    `f_${format}`,
    width ? `w_${width}` : '',
    height ? `h_${height}` : '',
    'c_fill',
  ]
    .filter(Boolean)
    .join(',')
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function csvExport(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv' }), filename)
}

export function avatarFallback(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function buildWhatsAppInvoiceLink(
  phone: string,
  params: {
    invoice_number: string
    tenant_name: string
    amount: number
    due_date: string
    upi_id?: string
  }
): string {
  const message = `Hello ${params.tenant_name},

Your rent invoice *${params.invoice_number}* has been generated.

*Amount Due:* ${formatCurrency(params.amount)}
*Due Date:* ${formatDate(params.due_date)}
${params.upi_id ? `\n💳 Pay via UPI: ${params.upi_id}` : ''}

Please pay before the due date.

_— Bangalore Premium PG Management_`

  return getWhatsAppUrl(phone, message)
}

