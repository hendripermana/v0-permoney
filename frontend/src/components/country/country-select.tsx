"use client"

import Image from "next/image"
import { useMemo } from "react"
import { listCountries, listCurrencies, type CountryOption } from "@/data/countries"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CountrySelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function CountrySelect({ value, onValueChange, placeholder = "Select country" }: CountrySelectProps) {
  const countries = useMemo(() => listCountries(), [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Countries</SelectLabel>
          {countries.map((country) => (
            <SelectItem key={country.countryCode} value={country.countryCode}>
              <CountryOptionRow country={country} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export interface CurrencySelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function CurrencySelect({ value, onValueChange, placeholder = "Select currency" }: CurrencySelectProps) {
  const currencies = useMemo(() => listCurrencies(), [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Currencies</SelectLabel>
          {currencies.map((currency) => (
            <SelectItem key={currency.currencyCode} value={currency.currencyCode}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{currency.currencyCode}</span>
                <span className="text-xs text-muted-foreground">{currency.currencySymbol}</span>
                <span className="text-xs text-muted-foreground">{currency.currencyName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function CountryOptionRow({ country }: { country: CountryOption }) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src={country.flagUrl}
        alt={`${country.countryName} flag`}
        width={24}
        height={18}
        className="rounded-sm border"
      />
      <span className="font-medium">{country.countryName}</span>
      <span className="text-xs text-muted-foreground">{country.currencyCode}</span>
      <span className="text-xs text-muted-foreground">{country.currencySymbol}</span>
    </span>
  )
}

