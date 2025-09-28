import dataset from "./countries.json"

export interface Country {
  countryCode: string
  countryName: string
  currencyCode: string
  currencyName: string
  currencySymbol: string
}

export type CountryOption = Country & {
  flagUrl: string
}

const FLAG_BASE_URL = "https://flagcdn.com/48x36"

const normalizeCode = (code: string) => code.trim().toLowerCase()

export const countries: CountryOption[] = dataset.map((entry) => ({
  ...entry,
  flagUrl: `${FLAG_BASE_URL}/${normalizeCode(entry.countryCode)}.png`,
}))

export const findCountry = (code: string) => {
  const normalized = code.trim().toUpperCase()
  return countries.find((country) => country.countryCode === normalized)
}

export const listCountries = () => countries

export const listCurrencies = () =>
  countries
    .map(({ currencyCode, currencyName, currencySymbol, countryCode }) => ({
      currencyCode,
      currencyName,
      currencySymbol,
      countryCode,
    }))
    .filter(
      (value, index, self) =>
        self.findIndex((candidate) => candidate.currencyCode === value.currencyCode) === index
    )
