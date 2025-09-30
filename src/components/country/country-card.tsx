"use client"

import Image from "next/image"
import { type CountryOption } from "@/data/countries"

interface CountryCardProps {
  country: CountryOption
}

export function CountryCard({ country }: CountryCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="shrink-0">
        <Image
          src={country.flagUrl}
          alt={`${country.countryName} flag`}
          width={48}
          height={36}
          className="rounded border"
        />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-muted-foreground">{country.countryName}</span>
        <span className="text-lg font-semibold">
          {country.currencyCode} · {country.currencySymbol}
        </span>
        <span className="text-xs text-muted-foreground">{country.currencyName}</span>
      </div>
    </article>
  )
}

