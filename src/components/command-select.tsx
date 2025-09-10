import { ReactNode, useState } from 'react';
import {  ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';

import {
    CommandInput,
    CommandEmpty,
    CommandItem,
    CommandList,
    CommandReponsiveDialog
} from '@/components/ui/command'

interface Props{
    options: Array<{
        id: string;
        value: string;
        children: ReactNode
    }>

    onSelect: (value: string) => void;
    onSearch: (value: string) => void;
    value: string;
    palceholder?: string
    isSearchable?: string
    className?: string
}

export const CommandSelect = ({
    options,
    onSelect,
    onSearch,
    value,
    palceholder = 'Select an options',
    className
}: Props) =>{
    const [open, setOpen] = useState(false)
    const selectedOption = options.find((option) => option.value === value)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                type='button'
                variant='outline'
                className={cn(
                    'h-9 justify-between font-normal px-2',
                    !selectedOption && 'text-muted-foreground',
                    className
                )}
            >
                <div>
                    {selectedOption?.children ?? palceholder}
                </div>
                <ChevronsUpDown />
            </Button>
            <CommandReponsiveDialog
                shouldFilter={!onSearch}
                open={open}
                onOpenChange={setOpen}
            >
                <CommandInput placeholder='Search...' onValueChange={onSearch} />
                <CommandList>
                    <CommandEmpty>
                        <span className='text-mutd-forground text-sm'>
                            No options found
                        </span>
                    </CommandEmpty>
                    {options.map((option) => (
                        <CommandItem
                            key={option.id}
                            onSelect={() => {
                                onSelect(option.value)
                                setOpen(false);
                            }}
                        >
                            {option.children}
                        </CommandItem>
                    ))}
                </CommandList>
            </CommandReponsiveDialog>
        </>
    )


}