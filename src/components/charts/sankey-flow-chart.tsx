"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemo } from "react"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface SankeyNode {
  name: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
}

interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

interface SankeyFlowChartProps {
  transactions?: any[]
  loading?: boolean
  title?: string
  description?: string
  className?: string
}

export function SankeyFlowChart({
  transactions = [],
  loading = false,
  title = "Money Flow",
  description = "Visualize how money flows through accounts and categories",
  className,
}: SankeyFlowChartProps) {
  const sankeyData = useMemo<SankeyData>(() => {
    // Defensive check - ensure transactions is an array
    const transactionsArray = Array.isArray(transactions) ? transactions : []
    
    if (transactionsArray.length === 0) {
      return {
        nodes: [],
        links: [],
      }
    }

    // Process transactions to build flow
    const incomeBySource = new Map<string, number>()
    const expenseByCategory = new Map<string, number>()
    const flowToAccounts = new Map<string, number>()

    transactionsArray.forEach((transaction) => {
      const amount = Math.abs(transaction.amountCents || 0) / 100
      const category = transaction.category?.name || "Uncategorized"
      const account = transaction.account?.name || "Unknown Account"

      if (transaction.amountCents > 0) {
        // Income transaction
        const source = category
        incomeBySource.set(source, (incomeBySource.get(source) || 0) + amount)
        flowToAccounts.set(
          `${source}->${account}`,
          (flowToAccounts.get(`${source}->${account}`) || 0) + amount
        )
      } else {
        // Expense transaction
        expenseByCategory.set(category, (expenseByCategory.get(category) || 0) + amount)
        flowToAccounts.set(
          `${account}->${category}`,
          (flowToAccounts.get(`${account}->${category}`) || 0) + amount
        )
      }
    })

    // Build nodes
    const nodes: SankeyNode[] = []
    const nodeMap = new Map<string, number>()

    const addNode = (name: string) => {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, nodes.length)
        nodes.push({ name })
      }
      return nodeMap.get(name)!
    }

    // Add income sources
    incomeBySource.forEach((_, source) => addNode(source))
    
    // Add accounts
    transactionsArray.forEach((t) => {
      const accountName = t.account?.name || "Unknown Account"
      addNode(accountName)
    })
    
    // Add expense categories
    expenseByCategory.forEach((_, category) => addNode(category))

    // Build links
    const links: SankeyLink[] = []

    // Income -> Accounts
    incomeBySource.forEach((amount, source) => {
      const sourceIdx = nodeMap.get(source)!
      transactionsArray
        .filter((t) => t.amountCents > 0 && (t.category?.name || "Uncategorized") === source)
        .forEach((t) => {
          const accountName = t.account?.name || "Unknown Account"
          const targetIdx = nodeMap.get(accountName)!
          const existingLink = links.find((l) => l.source === sourceIdx && l.target === targetIdx)
          if (existingLink) {
            existingLink.value += Math.abs(t.amountCents || 0) / 100
          } else {
            links.push({
              source: sourceIdx,
              target: targetIdx,
              value: Math.abs(t.amountCents || 0) / 100,
            })
          }
        })
    })

    // Accounts -> Expenses
    expenseByCategory.forEach((amount, category) => {
      const targetIdx = nodeMap.get(category)!
      transactionsArray
        .filter((t) => t.amountCents < 0 && (t.category?.name || "Uncategorized") === category)
        .forEach((t) => {
          const accountName = t.account?.name || "Unknown Account"
          const sourceIdx = nodeMap.get(accountName)!
          const existingLink = links.find((l) => l.source === sourceIdx && l.target === targetIdx)
          if (existingLink) {
            existingLink.value += Math.abs(t.amountCents || 0) / 100
          } else {
            links.push({
              source: sourceIdx,
              target: targetIdx,
              value: Math.abs(t.amountCents || 0) / 100,
            })
          }
        })
    })

    // Filter out very small flows (< 1% of total)
    const totalFlow = links.reduce((sum, link) => sum + link.value, 0)
    const minFlow = totalFlow * 0.01
    const filteredLinks = links.filter((link) => link.value >= minFlow)

    // Remove unused nodes
    const usedNodes = new Set<number>()
    filteredLinks.forEach((link) => {
      usedNodes.add(link.source)
      usedNodes.add(link.target)
    })

    const finalNodes = nodes.filter((_, idx) => usedNodes.has(idx))
    const nodeIndexMap = new Map<number, number>()
    finalNodes.forEach((_, newIdx) => {
      const oldIdx = Array.from(usedNodes)[newIdx]
      nodeIndexMap.set(oldIdx, newIdx)
    })

    const finalLinks = filteredLinks.map((link) => ({
      source: nodeIndexMap.get(link.source)!,
      target: nodeIndexMap.get(link.target)!,
      value: link.value,
    }))

    return {
      nodes: finalNodes,
      links: finalLinks,
    }
  }, [transactions])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No data to display</p>
              <p className="text-sm mt-2">Add transactions to see money flow</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Sankey
            data={sankeyData}
            node={{
              fill: "hsl(var(--primary))",
              fillOpacity: 0.8,
            }}
            link={{ stroke: "hsl(var(--muted))", strokeOpacity: 0.3 }}
            nodePadding={50}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const data = payload[0].payload
                
                if (data.source !== undefined && data.target !== undefined) {
                  // Link tooltip
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium">
                        {sankeyData.nodes[data.source]?.name} → {sankeyData.nodes[data.target]?.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(data.value)}
                      </p>
                    </div>
                  )
                } else {
                  // Node tooltip
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {formatCurrency(data.value)}
                      </p>
                    </div>
                  )
                }
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
