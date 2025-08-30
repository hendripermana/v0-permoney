"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertTriangle, CheckCircle, Database, Server, Wifi, RefreshCw } from "lucide-react"

interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  uptime: number
  version: string
  environment: string
  checks: {
    database: { status: string; responseTime?: number }
    redis: { status: string; responseTime?: number }
    memory: { status: string; usage?: number }
    disk: { status: string; usage?: number }
  }
  metrics: {
    system: {
      cpuCount: number
      loadAverage: number[]
      uptime: number
    }
    application: {
      processUptime: number
      memoryUsage: {
        heapUsed: number
        heapTotal: number
        rss: number
      }
    }
  }
}

export function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health/detailed")
      const data = await response.json()
      setHealthData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "error":
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
      case "healthy":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  if (loading && !healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading system health data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-red-600 mb-4">Failed to load system health data</p>
            <Button onClick={fetchHealthData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const memoryUsagePercent =
    (healthData.metrics.application.memoryUsage.heapUsed / healthData.metrics.application.memoryUsage.heapTotal) * 100

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(healthData.status)}>
                {getStatusIcon(healthData.status)}
                <span className="ml-1 capitalize">{healthData.status}</span>
              </Badge>
              <Button onClick={fetchHealthData} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            System uptime: {formatUptime(healthData.uptime)} • Version: {healthData.version} • Environment:{" "}
            {healthData.environment}
            {lastUpdated && (
              <span className="block mt-1 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Service Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Database</span>
              </div>
              <Badge className={getStatusColor(healthData.checks.database.status)}>
                {getStatusIcon(healthData.checks.database.status)}
              </Badge>
            </div>
            {healthData.checks.database.responseTime && (
              <p className="text-xs text-muted-foreground mt-1">
                Response: {healthData.checks.database.responseTime}ms
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="font-medium">Redis</span>
              </div>
              <Badge className={getStatusColor(healthData.checks.redis.status)}>
                {getStatusIcon(healthData.checks.redis.status)}
              </Badge>
            </div>
            {healthData.checks.redis.responseTime && (
              <p className="text-xs text-muted-foreground mt-1">Response: {healthData.checks.redis.responseTime}ms</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Memory</span>
              </div>
              <Badge className={getStatusColor(healthData.checks.memory.status)}>
                {getStatusIcon(healthData.checks.memory.status)}
              </Badge>
            </div>
            <div className="mt-2">
              <Progress value={memoryUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(healthData.metrics.application.memoryUsage.heapUsed)} /
                {formatBytes(healthData.metrics.application.memoryUsage.heapTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">Disk</span>
              </div>
              <Badge className={getStatusColor(healthData.checks.disk.status)}>
                {getStatusIcon(healthData.checks.disk.status)}
              </Badge>
            </div>
            {healthData.checks.disk.usage && (
              <div className="mt-2">
                <Progress value={healthData.checks.disk.usage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{healthData.checks.disk.usage}% used</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">CPU Cores</span>
              <span className="text-sm">{healthData.metrics.system.cpuCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Load Average</span>
              <span className="text-sm">
                {healthData.metrics.system.loadAverage.map((load) => load.toFixed(2)).join(", ")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">System Uptime</span>
              <span className="text-sm">{formatUptime(healthData.metrics.system.uptime)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Process Uptime</span>
              <span className="text-sm">{formatUptime(healthData.metrics.application.processUptime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Heap Memory</span>
              <span className="text-sm">
                {formatBytes(healthData.metrics.application.memoryUsage.heapUsed)} /
                {formatBytes(healthData.metrics.application.memoryUsage.heapTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">RSS Memory</span>
              <span className="text-sm">{formatBytes(healthData.metrics.application.memoryUsage.rss)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
