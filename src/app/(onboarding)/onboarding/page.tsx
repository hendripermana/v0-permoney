"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import type { FieldPath, UseFormReturn } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UploadCloud, User, CheckCircle, ArrowRight, ArrowLeft, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { CountrySelect, CurrencySelect } from "@/components/country/country-select"
import { findCountry, listCountries } from "@/data/countries"
import { OnboardingSummary } from "@/components/onboarding/onboarding-summary"
import { apiClient } from "@/lib/api-client"
import type { Household } from "@/types/household"

const onboardingSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  householdName: z.string().min(1, { message: "Household name is required" }),
  countryCode: z.string().min(2, { message: "Please select a country" }),
  currencyCode: z.string().min(2, { message: "Please select a currency" }),
  avatarFile: z.instanceof(File).optional(),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

const DEFAULT_COUNTRY_CODE = "ID"
const DEFAULT_CURRENCY_CODE = "IDR"
const SUPPORTED_BASE_CURRENCIES = new Set(["IDR", "USD", "EUR", "SGD", "MYR"])

const normalizeCurrencyCode = (code: string) => {
  const normalized = code.trim().toUpperCase()
  return SUPPORTED_BASE_CURRENCIES.has(normalized) ? normalized : DEFAULT_CURRENCY_CODE
}

const FIELDS_BY_STEP: Record<number, Array<keyof OnboardingFormValues>> = {
  0: ["firstName", "lastName", "householdName"],
  1: ["countryCode", "currencyCode"],
}

const ONBOARDING_STEPS = [
  {
    id: "profile",
    title: "Profile & Household",
    icon: User,
    description: "Introduce yourself and name your household",
  },
  {
    id: "preferences",
    title: "Region & Currency",
    icon: Globe,
    description: "Choose where you're based",
  },
]

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo<OnboardingFormValues>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    householdName: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    currencyCode: DEFAULT_CURRENCY_CODE,
    avatarFile: undefined,
  }), [user?.firstName, user?.lastName])

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: "onTouched",
  })

  const { watch, setValue } = form
  const countryCode = watch("countryCode")
  const currencyCode = watch("currencyCode")

  const availableCountries = useMemo(() => listCountries(), [])
  const defaultCountry = useMemo(() => findCountry(DEFAULT_COUNTRY_CODE), [])

  useEffect(() => {
    const matchedCountry = findCountry(countryCode) ?? defaultCountry
    const targetCurrency = matchedCountry?.currencyCode ?? DEFAULT_CURRENCY_CODE
    if (targetCurrency !== currencyCode) {
      setValue("currencyCode", targetCurrency)
    }
  }, [countryCode, currencyCode, setValue, defaultCountry])

  useEffect(() => {
    if (user?.imageUrl) {
      setUploadedPreview(user.imageUrl)
    }
  }, [user?.imageUrl])

  useEffect(() => {
    if (isLoaded && user) {
      const hasCompletedOnboarding = user.unsafeMetadata?.onboardingComplete === true
      const primaryHouseholdId = user.unsafeMetadata?.primaryHouseholdId
      if (hasCompletedOnboarding && primaryHouseholdId) {
        router.replace("/dashboard")
      }
    }
  }, [isLoaded, user, router])

  const nextStep = async () => {
    const fields = FIELDS_BY_STEP[currentStep] ?? []
    const isValid = await form.trigger(fields as FieldPath<OnboardingFormValues>[], { shouldFocus: true })
    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      })
      return
    }

    const step = ONBOARDING_STEPS[currentStep]
    if (step) {
      setCompletedSteps(prev => new Set([...prev, step.id]))
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    if (!user) return

    const isValid = await form.trigger(undefined, { shouldFocus: true })
    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before completing setup.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const values = form.getValues()
      const trimmedFirstName = values.firstName.trim()
      const trimmedLastName = values.lastName.trim()
      const trimmedHouseholdName = values.householdName.trim()

      if (!trimmedFirstName || !trimmedLastName || !trimmedHouseholdName) {
        toast({
          title: "Missing Information",
          description: "Please provide a valid first name, last name, and household name.",
          variant: "destructive",
        })
        return
      }
      const normalizedCountryCode = values.countryCode.trim().toUpperCase() || DEFAULT_COUNTRY_CODE
      const normalizedCurrencyCode = normalizeCurrencyCode(values.currencyCode)

      if (normalizedCurrencyCode !== values.currencyCode) {
        form.setValue("currencyCode", normalizedCurrencyCode, { shouldDirty: true, shouldTouch: true })
        toast({
          title: "Currency adjusted",
          description: "We currently support IDR, USD, EUR, SGD, and MYR as household base currencies.",
        })
      }

      let primaryHouseholdId: string | undefined
      let resolvedHousehold: Household | undefined

      const ensureHousehold = async () => {
        try {
          const households = await apiClient.getHouseholds()
          if (households && households.length > 0) {
            const [existing] = households
            primaryHouseholdId = existing.id
            const requiresUpdate =
              existing.name.trim() !== trimmedHouseholdName ||
              existing.baseCurrency.trim().toUpperCase() !== normalizedCurrencyCode

            if (requiresUpdate) {
              resolvedHousehold = await apiClient.updateHousehold(existing.id, {
                name: trimmedHouseholdName,
                baseCurrency: normalizedCurrencyCode,
              })
            } else {
              resolvedHousehold = existing
            }
            return
          }
        } catch (householdError) {
          console.error("Failed to load households:", householdError)
          throw householdError
        }

        const created = await apiClient.createHousehold({
          name: trimmedHouseholdName,
          baseCurrency: normalizedCurrencyCode,
        })

        primaryHouseholdId = created.id
        resolvedHousehold = created
      }

      await ensureHousehold()

      if (!primaryHouseholdId) {
        throw new Error("Unable to resolve household for onboarding")
      }

      if (values.avatarFile) {
        try {
          await user.setProfileImage({ file: values.avatarFile })
        } catch (avatarError) {
          console.error("Failed to upload profile image:", avatarError)
          toast({
            title: "Avatar upload failed",
            description: "We couldn't update your avatar right now. You can try again from profile settings.",
            variant: "destructive",
          })
        }
      }

      // Save user profile data to database
      try {
        const profileResponse = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            countryCode: normalizedCountryCode,
            preferredCurrency: normalizedCurrencyCode,
          }),
        })

        if (!profileResponse.ok) {
          throw new Error('Failed to save profile data')
        }

        console.log("✅ User profile saved to database")
      } catch (profileError) {
        console.error("Failed to save profile to database:", profileError)
        // Don't block onboarding completion, but log the error
      }

      // Update household with country data
      try {
        await apiClient.updateHousehold(primaryHouseholdId, {
          name: trimmedHouseholdName,
          baseCurrency: normalizedCurrencyCode,
          countryCode: normalizedCountryCode,
        })
        console.log("✅ Household location data saved")
      } catch (householdUpdateError) {
        console.error("Failed to update household location:", householdUpdateError)
      }

      const metadata = {
        ...user.unsafeMetadata,
        onboardingComplete: true,
        primaryHouseholdId,
        onboardingData: {
          completedAt: new Date().toISOString(),
          profile: {
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            countryCode: normalizedCountryCode,
            currencyCode: normalizedCurrencyCode,
          },
          household: {
            id: primaryHouseholdId,
            name: resolvedHousehold?.name ?? trimmedHouseholdName,
            baseCurrency: normalizedCurrencyCode,
          },
        },
      }

      await user.update({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        unsafeMetadata: metadata,
      })

      await user.reload()
      setCompletedSteps(prev => new Set([...prev, ONBOARDING_STEPS[currentStep]?.id ?? "preferences"]))

      toast({
        title: "Setup Complete!",
        description: "Your Permoney account is ready to use.",
      })

      router.replace("/dashboard")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast({
        title: "Setup Failed",
        description: "Unable to complete setup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep + (completedSteps.size > currentStep ? 1 : 0)) / ONBOARDING_STEPS.length) * 100

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Permoney!</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your account to get the most out of your personal finance management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Setup Progress</h3>
              <span className="text-sm text-muted-foreground">
                {completedSteps.size + (currentStep < ONBOARDING_STEPS.length ? 1 : 0)} of {ONBOARDING_STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="space-y-6">
            <Form {...form}>
              <div className="space-y-6">
                {currentStep === 0 && (
                  <ProfileStep
                    form={form}
                    uploadedPreview={uploadedPreview}
                    onAvatarChange={({ file, preview }) => {
                      setValue("avatarFile", file)
                      setUploadedPreview(preview)
                    }}
                  />
                )}

                {currentStep === 1 && (
                  <PreferencesStep
                    form={form}
                    selectedCountryCode={countryCode}
                    selectedCurrencyCode={currencyCode}
                    householdName={form.watch("householdName")}
                    avatarPreview={uploadedPreview}
            firstName={form.watch("firstName")}
            lastName={form.watch("lastName")}
                  />
                )}
              </div>
            </Form>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <Button onClick={completeOnboarding} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Setup...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ProfileStepProps {
  form: UseFormReturn<OnboardingFormValues>
  uploadedPreview: string | null
  onAvatarChange: (params: { file?: File; preview: string | null }) => void
}

function ProfileStep({ form, uploadedPreview, onAvatarChange }: ProfileStepProps) {
  const { control, watch } = form
  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const householdName = watch("householdName")
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "P"

  return (
    <section className="space-y-6">
      <header className="text-center space-y-2">
        <User className="h-12 w-12 text-green-500 mx-auto" />
        <h4 className="text-2xl font-semibold">Profile & Household</h4>
        <p className="text-muted-foreground">Introduce yourself and name the household you manage.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="householdName"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Household Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Suryani Family" {...field} />
              </FormControl>
              <FormDescription>Household names help distinguish dashboards if you collaborate with others.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/20 p-6">
        <Avatar className="h-20 w-20 border">
          {uploadedPreview ? (
            <AvatarImage src={uploadedPreview} alt={`${firstName} ${lastName}`.trim() || "Profile preview"} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <Button
          type="button"
          variant="outline"
          className="w-full max-w-xs justify-center"
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/*"
            input.onchange = (event) => {
              const file = (event.target as HTMLInputElement).files?.[0]
              if (!file) {
                onAvatarChange({ preview: null })
                form.setValue("avatarFile", undefined)
                return
              }

              const reader = new FileReader()
              reader.onload = () => {
                const preview = typeof reader.result === "string" ? reader.result : null
                onAvatarChange({ file, preview })
                form.setValue("avatarFile", file)
              }
              reader.readAsDataURL(file)
            }
            input.click()
          }}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload profile photo
        </Button>
        {uploadedPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              onAvatarChange({ preview: null })
              form.setValue("avatarFile", undefined)
            }}
          >
            Remove photo
          </Button>
        )}
      </div>
    </section>
  )
}

interface PreferencesStepProps {
  form: UseFormReturn<OnboardingFormValues>
  selectedCountryCode: string
  selectedCurrencyCode: string
  householdName: string
  firstName: string
  lastName: string
  avatarPreview: string | null
}

function PreferencesStep({ form, selectedCountryCode, selectedCurrencyCode, householdName, firstName, lastName, avatarPreview }: PreferencesStepProps) {
  const { control } = form
  const selectedCountry = findCountry(selectedCountryCode)

  return (
    <section className="space-y-6">
      <header className="text-center space-y-2">
        <Globe className="h-12 w-12 text-green-500 mx-auto" />
        <h4 className="text-2xl font-semibold">Region & Currency</h4>
        <p className="text-muted-foreground">We tailor insights based on where you live and transact.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <CountrySelect value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormDescription>Select the country you primarily manage finances in.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="currencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Currency</FormLabel>
              <FormControl>
                <CurrencySelect value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormDescription>We use this to default reporting and budgeting values.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <OnboardingSummary
        firstName={firstName}
        lastName={lastName}
        countryCode={selectedCountryCode}
        currencyCode={selectedCurrencyCode}
        householdName={householdName}
        avatarPreview={avatarPreview}
      />

      {selectedCountry && (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">{selectedCountry.countryName}</span> uses {selectedCountry.currencyName} ({
              selectedCountry.currencyCode
            }). You can adjust these selections later in your profile settings.
          </p>
        </div>
      )}
    </section>
  )
}

interface HouseholdStepProps {
  form: UseFormReturn<OnboardingFormValues>
  summaryPreview: string | null
}

function HouseholdStep() {
  return null
}
