"use client"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { PanelLeftCloseIcon, PanelsLeftBottom, SearchIcon } from "lucide-react"
import DashboardCommand from "./dashboard-command"
import { useEffect, useState } from "react"

export const DashboardNavBar = () =>{
    // Since i wrap my entire dashboard inside a sidebarProvider i can now access usesideabr in any of it's children
    // and in here i can get the current state of the side bar i can toggle it and aslo isMobile  all you can how it's work on shadcn docs
    const {state, isMobile, toggleSidebar} = useSidebar() // state=> expanded or collapsed The current state of the sidebar, isMobile=> boolean	Whether the sidebar is on mobile, toggleSidebar =>	() => void	Toggles the sidebar. Desktop and mobile.
    const [commandOpen, setCommandOpen] = useState(false)


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Sirf tabhi open/close ho jab cmd/ctrl + k press ho, na ki alag alag
            if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);


    return (
        <>
            <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
            <nav className="flex px-4 gap-x-2 items-center py-3 border-b bg-background">
                <Button className="size-9" variant="outline" onClick={toggleSidebar}>  
                    {state === "collapsed" || isMobile ? <PanelsLeftBottom className="size-4" /> : <PanelLeftCloseIcon className="size-4" /> }
                </Button>
                <Button
                    className="h-9 w-[240px] justify-start font-normal text-muted-foreground hover: text-muted-foreground"
                    variant="outline"
                    size="sm"
                    onClick={() => setCommandOpen((open) => !open)}
                >
                    <SearchIcon />
                        Search
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">&#8984;</span>K
                    </kbd>
                </Button>   
            </nav>
        </>
    )
}