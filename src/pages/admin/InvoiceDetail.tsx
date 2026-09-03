import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Printer, CheckCircle2, Clock, MapPin, Phone, Mail, Building2, User, Calendar, FileText, CheckCircle, Smartphone, Download, AlertCircle } from 'lucide-react'
import QRCode from 'react-qr-code'
import { getInvoice, markInvoicePaid } from '@/services/invoiceService'
import { getInvoiceSettings } from '@/services/settingsService'
import { formatCurrency, formatDate } from '@/utils'
import toast from 'react-hot-toast'
import logoImage from '@/assets/AR PG Logo.png'
import { toPng, toBlob } from 'html-to-image'
import { jsPDF } from 'jspdf'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  })

  // Fetch billing settings
  const { data: settings } = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: getInvoiceSettings
  })

  const markPaidMutation = useMutation({
    mutationFn: () => markInvoicePaid(id!, Number(invoice?.total_amount || 0)),
    onSuccess: () => {
      toast.success('Invoice marked as paid!')
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update invoice'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto p-8">
        <div className="h-8 w-1/4 bg-muted rounded"></div>
        <div className="h-[800px] bg-muted rounded-xl"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Invoice not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-xl font-medium">Go Back</button>
      </div>
    )
  }

  const tenant = invoice.tenant as any || {}
  const property = invoice.property as any || {}
  const room = invoice.room as any || {}

  // Format for the month display (e.g. "May 2025")
  const billMonth = new Date(invoice.billing_period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Dynamic Settings Fallbacks
  const upiId = settings?.upiId || 'atharvreddypg@upi'
  const bankName = settings?.bankName || 'HDFC Bank'
  const accountNumber = settings?.accountNumber || '5020 1234 5678 90'
  const ifscCode = settings?.ifscCode || 'HDFC0001234'

  const pgName = property.name || 'Atharv Reddy PG'
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(pgName)}&am=${invoice.balance_due}&cu=INR&tn=Rent_Bill_${invoice.invoice_number}`

  // Table Data mapping to handle dynamic fees
  const tableRows = []
  let rowCount = 1
  if (Number(invoice.rent_amount) > 0) tableRows.push({ id: rowCount++, particulars: 'Rent', desc: 'Monthly Room Rent', amount: invoice.rent_amount })
  if (Number(invoice.maintenance_fee) > 0) tableRows.push({ id: rowCount++, particulars: 'Maintenance', desc: 'General Maintenance', amount: invoice.maintenance_fee })
  if (Number(invoice.electricity_fee) > 0) tableRows.push({ id: rowCount++, particulars: 'Electricity', desc: 'Electricity Charges', amount: invoice.electricity_fee })
  if (Number(invoice.water_fee) > 0) tableRows.push({ id: rowCount++, particulars: 'Water', desc: 'Water Charges', amount: invoice.water_fee })
  if (Number(invoice.other_charges) > 0) tableRows.push({ id: rowCount++, particulars: 'Other Charges', desc: 'Miscellaneous', amount: invoice.other_charges })
  if (Number(invoice.late_fee) > 0) tableRows.push({ id: rowCount++, particulars: 'Late Fee', desc: 'Late Payment Penalty', amount: invoice.late_fee })
  if (Number(invoice.discount) > 0) tableRows.push({ id: rowCount++, particulars: 'Discount', desc: 'Discount Applied', amount: -Number(invoice.discount) })

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      element.classList.add('print:shadow-none');
      const dataUrl = await toPng(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      element.classList.remove('print:shadow-none');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const displayInvoiceNumber = invoice.invoice_number?.startsWith('ARPG-') ? invoice.invoice_number : 'ARPG-2026-001';
      pdf.save(`Invoice_${displayInvoiceNumber}.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  const handleWhatsApp = async () => {
    const phone = tenant.phone;
    if (!phone) {
      toast.error('No mobile number available for this tenant.');
      return;
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    const displayInvoiceNumber = invoice.invoice_number?.startsWith('ARPG-') ? invoice.invoice_number : 'ARPG-2026-001';
    const invoiceLink = window.location.href;
    const message = `*Hello ${tenant.full_name},*\n\nHere is your rent invoice for *${billMonth}*.\n\n*Invoice ID:* ${displayInvoiceNumber}\n*Amount Due:* ₹${invoice.balance_due}\n*Due Date:* ${formatDate(invoice.due_date)}\n\nYou can view your full invoice online here:\n${invoiceLink}\n\nPlease make the payment before the due date to avoid late fees.\n\nThank you,\n*${pgName}*\n\n*Generated by Arpg.loganathanm.in*`;
    
    toast.loading('Preparing WhatsApp message & Image...', { id: 'wa-toast' });
    
    try {
      const element = document.getElementById('invoice-print-area');
      if (element) {
        element.classList.add('print:shadow-none');
        const blob = await toBlob(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
        element.classList.remove('print:shadow-none');
        
        if (!blob) throw new Error('Failed to create image blob');
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Image copied! Just PASTE (Ctrl+V) inside WhatsApp chat to attach it!', { id: 'wa-toast', duration: 6000 });
        } catch (clipErr) {
          const link = document.createElement('a');
          link.download = `Invoice_${displayInvoiceNumber}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          toast.success('Image downloaded! Please drag it to WhatsApp.', { id: 'wa-toast', duration: 4000 });
        }

        setTimeout(() => {
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
          const waLink = document.createElement('a');
          waLink.href = whatsappUrl;
          waLink.target = '_blank';
          waLink.rel = 'noopener noreferrer';
          document.body.appendChild(waLink);
          waLink.click();
          document.body.removeChild(waLink);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Image, opening WhatsApp anyway...', { id: 'wa-toast' });
    }
  };

  return (
    <div className='max-w-[1000px] mx-auto pb-24'>

      {/* Controls (Hidden on Print) */}
      <div className='print:hidden flex items-center justify-between mb-8'>
        <button onClick={() => navigate(-1)} className='p-2 rounded-xl hover:bg-accent transition-colors bg-card shadow-sm border border-border'>
          <ArrowLeft className='w-5 h-5' />
        </button>
        <div className='flex gap-3'>
          {invoice.status !== 'paid' && (
            <button
              onClick={() => {
                if (window.confirm('Mark this invoice as fully paid?')) {
                  markPaidMutation.mutate()
                }
              }}
              disabled={markPaidMutation.isPending}
              className='flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-sm'
            >
              <CheckCircle2 className='w-4 h-4' /> Mark as Paid
            </button>
          )}
          
          {/* New Action Buttons */}
          <button
            onClick={handleDownloadPDF}
            className='flex items-center gap-2 px-4 py-2 bg-[#d4b26a] hover:bg-[#c4a159] text-[#0a1a3a] rounded-lg font-bold transition-all shadow-lg text-sm'
          >
            <Download className='w-4 h-4' /> Download PDF
          </button>
          
          <button
            onClick={() => window.print()}
            className='flex items-center gap-2 px-4 py-2 bg-[#0a1a3a] hover:bg-[#122a59] text-white rounded-lg font-medium transition-all shadow-lg text-sm'
          >
            <Printer className='w-4 h-4' /> Print
          </button>
          
          <button
            onClick={handleWhatsApp}
            className='flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-all shadow-lg text-sm'
          >
            <Smartphone className='w-4 h-4' /> WhatsApp
          </button>
        </div>
      </div>
      {/* Responsive Wrapper for Mobile Panning */}
      <div className="w-full overflow-x-auto py-8 px-4 flex justify-start md:justify-center">
        {/* Invoice Document (A4 format) */}
        <div id="invoice-print-area" className='bg-white shadow-2xl border border-gray-100 relative print:shadow-none print:border-none min-w-[210mm] w-[210mm] shrink-0' style={{ minHeight: '1300px' }}>
          {/* Top Gold Border */}
          <div className="h-3 w-full bg-[#d4b26a]"></div>

          {/* Outer Navy Border Wrapper */}
          <div className="border-[3px] border-[#0a1a3a] m-3 absolute inset-0 bottom-0 pointer-events-none z-50 rounded-sm"></div>

          {/* Content Wrapper */}
          <div className="p-0 relative z-10">

            {/* HEADER */}
            <div className="flex justify-between items-start">
              {/* Left Shape */}
              <div
                className="bg-[#0a1a3a] text-white pt-8 pb-12 pl-12 pr-24 relative flex items-center justify-center"
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)', width: '48%', minHeight: '220px' }}
              >
                <div className="flex flex-col items-center justify-center -ml-8">
                  <img src={logoImage} alt="Atharv Luxury PG Logo" className="h-44 object-contain" />
                </div>
              </div>

              {/* Right Side Header */}
              <div className="pt-16 pr-14 text-right flex flex-col items-end">
                <h2 className="text-[2.75rem] font-serif text-[#0a1a3a] font-bold tracking-tight mb-4">RENT BILL</h2>

                {/* Decorative separator */}
                <div className="flex justify-end gap-2 items-center mb-6 opacity-60">
                  <div className="w-1.5 h-1.5 rounded-full border border-[#0a1a3a]"></div>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0a1a3a] flex items-center justify-center">
                    <div className="w-1 h-1 bg-[#0a1a3a] rounded-full"></div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full border border-[#0a1a3a]"></div>
                </div>

                <div className="bg-[#0a1a3a] text-[#d4b26a] px-8 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase shadow-md">
                  BILL ID : {invoice.invoice_number?.startsWith('ARPG-') ? invoice.invoice_number : 'ARPG-2026-001'}
                </div>
              </div>
            </div>

            {/* 3 COLUMN INFO SECTION */}
            <div className="px-14 mt-12 grid grid-cols-[1.2fr_1.5fr_1fr] gap-6">

              {/* Col 1: Bill To */}
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#0a1a3a] text-[#d4b26a] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[#0a1a3a] font-bold tracking-widest text-[13px] uppercase mt-0.5">BILL TO</span>
                </div>
                <h3 className="text-[22px] font-bold text-[#0a1a3a] mb-4 leading-none">{tenant.full_name || 'Tenant Name'}</h3>
                <div className="flex flex-col gap-3 text-[15px] text-[#334155]">
                  <p>Room No. {room.room_number || 'N/A'}</p>
                  <p>{pgName}</p>
                  <p className="leading-relaxed">{property.address || 'Chennai, Tamil Nadu'}</p>
                  <p>Mobile: {tenant.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Col 2: Bill Details */}
              <div className="border border-gray-200 rounded-3xl rounded-tr-sm rounded-bl-sm p-6 relative bg-white mt-1.5 flex-1 min-w-[200px]">
                <div className="absolute -top-3 bg-white px-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#d4b26a] text-white rounded-md flex items-center justify-center shadow-sm">
                    <FileText className="w-3 h-3" />
                  </div>
                  <span className="text-[#d4b26a] font-bold tracking-widest text-[11px] uppercase">BILL DETAILS</span>
                </div>
                
                <div className="mt-4 space-y-4 text-[13px] pr-2">
                  <div className="grid grid-cols-[70px_1fr] items-start gap-1">
                    <span className="font-medium text-[#334155]">UPI ID</span>
                    <span className="font-bold text-[#0a1a3a] break-words">: {upiId}</span>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] items-start gap-1">
                    <span className="font-medium text-[#334155]">Bank</span>
                    <span className="font-bold text-[#0a1a3a]">: {bankName}</span>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] items-start gap-1">
                    <span className="font-medium text-[#334155]">A/C No.</span>
                    <span className="font-bold text-[#0a1a3a]">: {accountNumber}</span>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] items-start gap-1">
                    <span className="font-medium text-[#334155]">IFSC Code</span>
                    <span className="font-bold text-[#0a1a3a] break-words">: {ifscCode}</span>
                  </div>
                </div>
              </div>

              {/* Col 3: Dates */}
              <div className="space-y-6 pt-2 w-[180px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0a1a3a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1 text-[13px] w-full">
                    <span className="text-[#334155] w-12 shrink-0">Bill Date</span>
                    <span className="font-bold text-[#0a1a3a] flex-1 leading-tight pl-1">: {formatDate(invoice.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0a1a3a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1 text-[13px] w-full">
                    <span className="text-[#334155] w-12 shrink-0">Due Date</span>
                    <span className="font-bold text-[#0a1a3a] flex-1 leading-tight pl-1">: {formatDate(invoice.due_date)}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0a1a3a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1 text-[13px] w-full">
                    <span className="text-[#334155] w-12 shrink-0">For Month</span>
                    <span className="font-bold text-[#0a1a3a] flex-1 leading-tight pl-1">: {billMonth}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0a1a3a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1 text-[13px] w-full items-center">
                    <span className="text-[#334155] w-12 shrink-0">Room</span>
                    <span className="font-bold text-[#0a1a3a] flex-1 pl-1">: {(room.room_type || 'Shared').charAt(0).toUpperCase() + (room.room_type || 'Shared').slice(1)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* TABLE SECTION */}
            <div className="px-14 mt-12">
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0a1a3a] text-[#d4b26a]">
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-sm w-16 text-center">#</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-sm">PARTICULARS</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-sm">DESCRIPTION</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-sm text-right">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {tableRows.map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-5 px-6 text-center text-gray-600">{row.id}</td>
                        <td className="py-5 px-6 text-gray-800 font-medium">{row.particulars}</td>
                        <td className="py-5 px-6 text-gray-600">{row.desc}</td>
                        <td className="py-5 px-6 text-[#0a1a3a] font-semibold text-right">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TOTAL ROW */}
                <div className="flex w-full text-lg">
                  <div className="bg-[#0a1a3a] text-white flex-grow flex items-center justify-end pr-10 py-4 font-bold tracking-widest">
                    TOTAL AMOUNT
                  </div>
                  <div className="bg-[#d4b26a] text-[#0a1a3a] w-64 flex items-center justify-end px-6 py-4 font-bold text-xl">
                    {formatCurrency(invoice.total_amount)}
                  </div>
                </div>
              </div>
            </div>            {/* BOTTOM SECTION */}
            <div className="px-10 mt-12 flex justify-between items-start gap-6">

              {/* Left: Notes */}
              <div className="border border-gray-200 rounded-3xl rounded-tr-sm rounded-bl-sm p-6 relative bg-white w-64 mt-2 shrink-0">
                <div className="absolute -top-5 left-6 bg-white px-3 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-[#d4b26a] mt-0.5" />
                  <span className="text-[#d4b26a] font-bold tracking-widest text-[11px] uppercase leading-tight">IMPORTANT<br />NOTES</span>
                </div>

                <ul className="text-[11px] text-[#334155] space-y-4 mt-3 font-medium">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4b26a] shrink-0 mt-1.5 opacity-80"></div>
                    <span className="leading-relaxed">Please make the payment before the due date to avoid late fee.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4b26a] shrink-0 mt-1.5 opacity-80"></div>
                    <span className="leading-relaxed">A late fee of ₹50 will be charged if the payment is not made by the due date.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4b26a] shrink-0 mt-1.5 opacity-80"></div>
                    <span className="leading-relaxed">This is a computer generated bill and does not require any signature.</span>
                  </li>
                </ul>
              </div>

              {/* Right: Payment Method & Status */}
              <div className="flex gap-4">

                {/* Payment Method QR */}
                <div className="border border-gray-200 rounded-3xl rounded-tr-sm rounded-bl-sm p-4 relative bg-white w-48 flex flex-col items-center text-center mt-2 shrink-0">
                  <div className="absolute -top-3 bg-white px-3 flex items-center gap-2">
                    <span className="text-[#d4b26a] font-bold tracking-widest text-[10px] uppercase">PAYMENT METHOD</span>
                  </div>

                  <p className="text-xs font-bold text-[#0a1a3a] mt-2 mb-1">SCAN & PAY</p>
                  <p className="text-[9px] text-gray-500 mb-3">UPI ID: {upiId}</p>

                  <div className="p-2 border border-gray-200 rounded-2xl bg-white w-28 h-28 flex items-center justify-center">
                    <QRCode value={upiUrl} size={100} style={{ height: "96px", maxWidth: "96px", width: "96px" }} viewBox={`0 0 100 100`} />
                  </div>

                  <p className="text-[10px] text-[#64748b] mt-4 font-medium">Thank you for your payment</p>
                </div>

                {/* Status Badge */}
                <div className="border border-gray-200 rounded-3xl rounded-tr-sm rounded-bl-sm p-4 relative bg-white w-48 flex flex-col items-center text-center mt-2 shrink-0">
                  <div className="absolute -top-3 bg-white px-3 flex items-center gap-2">
                    <span className="text-[#d4b26a] font-bold tracking-widest text-[10px] uppercase">PAYMENT STATUS</span>
                  </div>

                  <div className={`w-[90%] py-3 rounded-2xl flex flex-col items-center justify-center mt-4 border ${invoice.status === 'paid'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : invoice.status === 'overdue'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-[#fff9eb] border-[#fde6b3] text-[#b45309]'
                    }`}>
                    {invoice.status === 'paid' ? (
                      <CheckCircle className="w-8 h-8 mb-2" strokeWidth={2.5} />
                    ) : invoice.status === 'overdue' ? (
                      <AlertCircle className="w-8 h-8 mb-2" strokeWidth={2.5} />
                    ) : (
                      <Clock className="w-8 h-8 mb-2" strokeWidth={2.5} />
                    )}
                    <span className="font-bold tracking-widest text-sm uppercase">
                      {invoice.status === 'pending' ? 'UNPAID' : invoice.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#64748b] mt-4 leading-tight px-2">We appreciate your<br />timely payment.</p>
                  
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-3.5 h-3.5 text-[#d4b26a] fill-[#d4b26a]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-28"></div> {/* Spacer to prevent footer overlap */}

            {/* FOOTER */}
            <div className="absolute bottom-0 left-0 w-full bg-[#0a1a3a] min-h-[4rem] py-3 flex items-center justify-between px-10 text-[#d4b26a] text-[10px]">
              <div className="flex items-start gap-2 max-w-[55%]">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">50, Chikkabegur, opposite to dayananda Sagar University, near Metro station, Kudlu Gate, Industrial Layout, Begur, Bengaluru, Karnataka 560068</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>atharvreddypg@gmail.com</span>
              </div>
              <div className="text-right font-medium opacity-80 tracking-wide">
                <span>Generated Arpg.loganathanm.in</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}