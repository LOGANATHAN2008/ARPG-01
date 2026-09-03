import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
export default function Announcements() {
  const navigate = useNavigate()
  return (
    <div className='space-y-6'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Announcements</h1>
          <p className='page-subtitle'>Coming soon</p>
        </div>
      </div>
      <div className='pg-card p-10 text-center text-muted-foreground'>
        <p className='text-lg font-semibold mb-2'>Announcements</p>
        <p className='text-sm'>This page is under development. All data services are ready.</p>
        <button onClick={() => navigate(-1)} className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium'>Go Back</button>
      </div>
    </div>
  )
}