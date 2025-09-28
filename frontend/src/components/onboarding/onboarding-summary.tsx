"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { findCountry } from "@/data/countries"

interface OnboardingSummaryProps {
  firstName: string
  lastName: string
  countryCode: string
  currencyCode: string
  householdName: string
  avatarPreview?: string | null
}

export function OnboardingSummary({
  firstName,
  lastName,
  countryCode,
  currencyCode,
  householdName,
  avatarPreview,
}: OnboardingSummaryProps) {
  const country = findCountry(countryCode)
  const fullName = `${firstName} ${lastName}`.trim()
  const initials = [firstName, lastName].filter(Boolean).map((part) => part[0]?.toUpperCase()).join("") || "P"

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          {avatarPreview ? (
            <AvatarImage src={avatarPreview} alt={fullName || householdName || "Profile preview"} />
          ) : country ? (
            <AvatarImage src={country.flagUrl} alt={country.countryName} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-1 flex-col">
          <span className="text-sm text-muted-foreground">You are setting up</span>
          <span className="text-lg font-semibold">{householdName || fullName || "Your household"}</span>
          <span className="text-xs text-muted-foreground">
            {country ? `${country.countryName} · ${country.currencyCode}` : currencyCode}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

