import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, Wallet, PiggyBank } from "lucide-react"

export default function AccountsPage() {
  const accounts = [
    {
      id: 1,
      name: "BCA Checking",
      type: "Checking",
      balance: 15750000,
      currency: "IDR",
      status: "active",
      icon: CreditCard,
    },
    {
      id: 2,
      name: "Mandiri Savings",
      type: "Savings",
      balance: 45200000,
      currency: "IDR",
      status: "active",
      icon: PiggyBank,
    },
    {
      id: 3,
      name: "Cash Wallet",
      type: "Cash",
      balance: 2500000,
      currency: "IDR",
      status: "active",
      icon: Wallet,
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts and track balances</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across {accounts.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => {
          const IconComponent = account.icon
          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription>{account.type} Account</CardDescription>
                    </div>
                  </div>
                  <Badge variant={account.status === "active" ? "default" : "secondary"}>{account.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
