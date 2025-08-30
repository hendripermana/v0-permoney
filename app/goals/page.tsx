import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, Calendar, TrendingUp } from "lucide-react"

export default function GoalsPage() {
  const goals = [
    {
      id: 1,
      title: "Emergency Fund",
      description: "Build 6 months of expenses as emergency fund",
      targetAmount: 60000000,
      currentAmount: 35000000,
      deadline: "2024-12-31",
      category: "Savings",
      status: "in-progress",
    },
    {
      id: 2,
      title: "Vacation to Japan",
      description: "Save for family vacation to Japan",
      targetAmount: 25000000,
      currentAmount: 18500000,
      deadline: "2024-08-15",
      category: "Travel",
      status: "in-progress",
    },
    {
      id: 3,
      title: "New Car Down Payment",
      description: "Save for car down payment",
      targetAmount: 50000000,
      currentAmount: 12000000,
      deadline: "2025-06-30",
      category: "Transportation",
      status: "in-progress",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const totalGoalsAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">Track your progress towards financial milestones</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">Active financial goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalGoalsAmount)}</div>
            <p className="text-xs text-muted-foreground">Combined goal amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSavedAmount)}</div>
            <p className="text-xs text-muted-foreground">Amount saved so far</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((totalSavedAmount / totalGoalsAmount) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Of total goals achieved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
          const remaining = goal.targetAmount - goal.currentAmount

          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{goal.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold text-green-600">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-semibold text-orange-600">{formatCurrency(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-semibold flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(goal.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Add Money
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Goal
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
