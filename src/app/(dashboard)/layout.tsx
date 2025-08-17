import { SidebarProvider } from "@/components/ui/sidebar"
import { DashbaordSideBar } from "@/modules/dashboard/ui/components/dashboard-sidebar"

interface Props {
    children: React.ReactNode
}


function Layout({children}: Props) {
  return (
   <SidebarProvider>
        <DashbaordSideBar />
        <main className="flex flex-col h-screen w-screen bg-muted">
            {children}
        </main>
   </SidebarProvider>
  )
}

export default Layout
