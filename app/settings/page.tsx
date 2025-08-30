import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Palette, Database } from "lucide-react"

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: "Profile Settings",
      description: "Manage your personal information and preferences",
      icon: User,
      settings: [
        { name: "Full Name", value: "John Doe", type: "text" },
        { name: "Email", value: "john.doe@example.com", type: "email" },
        { name: "Phone", value: "+62 812 3456 7890", type: "phone" },
        { name: "Currency", value: "IDR", type: "select" },
      ],
    },
    {
      title: "Notifications",
      description: "Configure how you receive notifications",
      icon: Bell,
      settings: [
        { name: "Email Notifications", value: true, type: "toggle" },
        { name: "Push Notifications", value: false, type: "toggle" },
        { name: "Budget Alerts", value: true, type: "toggle" },
        { name: "Transaction Alerts", value: true, type: "toggle" },
      ],
    },
    {
      title: "Security",
      description: "Manage your account security settings",
      icon: Shield,
      settings: [
        { name: "Two-Factor Authentication", value: false, type: "toggle" },
        { name: "Login Notifications", value: true, type: "toggle" },
        { name: "Session Timeout", value: "30 minutes", type: "select" },
      ],
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of your app",
      icon: Palette,
      settings: [
        { name: "Theme", value: "Light", type: "select" },
        { name: "Language", value: "English", type: "select" },
        { name: "Date Format", value: "DD/MM/YYYY", type: "select" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {settingsCategories.map((category, index) => {
          const IconComponent = category.icon
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IconComponent className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.settings.map((setting, settingIndex) => (
                  <div key={settingIndex} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{setting.name}</p>
                      {setting.type !== "toggle" && <p className="text-sm text-muted-foreground">{setting.value}</p>}
                    </div>
                    <div>
                      {setting.type === "toggle" ? (
                        <Switch checked={setting.value as boolean} />
                      ) : (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Database className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-red-600">Export Data</p>
              <p className="text-sm text-muted-foreground">Download all your financial data</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
