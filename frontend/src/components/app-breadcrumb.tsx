"use client"

import { Fragment } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

const LEGACY_PREFIX = "/app"

const toTitleCase = (value: string) =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())

const normalizePath = (pathname: string) =>
  pathname.startsWith(LEGACY_PREFIX) ? pathname.slice(LEGACY_PREFIX.length) || "/" : pathname

const buildSegmentHref = (segments: string[], index: number) => `/${segments.slice(0, index + 1).join("/")}`

export function AppBreadcrumb() {
  const rawPathname = usePathname()
  const pathname = normalizePath(rawPathname ?? "/")

  if (pathname === "/") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = buildSegmentHref(segments, index)
          const label = toTitleCase(segment)
          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <span className="font-medium text-foreground">{label}</span>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
