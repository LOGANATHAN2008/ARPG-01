import { FolderOpen } from "lucide-react"
export default function TenantDocuments() {
  return (
    <div className="space-y-5">
      <h1 className="page-title">Documents</h1>
      <div className="text-center py-16"><FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">Your documents will appear here.</p><p className="text-xs text-muted-foreground mt-1">Contact admin to upload documents.</p></div>
    </div>
  )
}