import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { SetStateAction, Dispatch } from "react"

interface props{
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>
}

function DashboardCommand({open, setOpen}: props) {


  return (
    <CommandDialog open={open} onOpenChange={setOpen} >
        <CommandInput placeholder="Find a meeting or agent" />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
                <CommandItem>Calendar</CommandItem>
                <CommandItem>Search Emoji</CommandItem>
                <CommandItem>Calculator</CommandItem>
            </CommandGroup>
        </CommandList>
    </CommandDialog>
  )
}

export default DashboardCommand
