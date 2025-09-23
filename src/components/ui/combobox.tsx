"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxItem {
    value: string
    label: string
    logo?: string
}

interface ComboboxProps {
    items: ComboboxItem[]
    placeholder?: string
    searchPlaceholder?: string
    notfoundText?: string
    onSelect?: (value: string) => void
}

export function Combobox({ items, placeholder, searchPlaceholder, notfoundText, onSelect }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder ?? "Select item..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? "Search item..."} />
          <CommandEmpty>{notfoundText ?? "No item found."}</CommandEmpty>
          <CommandList>
            <CommandGroup>
                {items.map((item) => (
                <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                        const newValue = currentValue === value ? "" : currentValue;
                        setValue(newValue);
                        if (onSelect) {
                            onSelect(newValue);
                        }
                        setOpen(false)
                    }}
                >
                    <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            value === item.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    <div className="flex items-center gap-2">
                        {item.logo && (
                             <div className="relative h-5 w-8">
                                <Image src={item.logo} alt={`${item.label} logo`} fill className="object-contain" />
                            </div>
                        )}
                        <span>{item.label}</span>
                    </div>
                </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}