import countriesJson from "./iso3166-countries.json" with { type: "json" };

export type CountryOption = {
  code: string;
  name: string;
};

export const ISO_COUNTRIES = countriesJson as CountryOption[];

export const ISO_COUNTRY_CODES = new Set(ISO_COUNTRIES.map((country) => country.code));

export function getCountryName(code: string): string | null {
  const normalized = code.toUpperCase();
  return ISO_COUNTRIES.find((country) => country.code === normalized)?.name ?? null;
}

export function formatCountryLabel(code: string): string {
  const name = getCountryName(code);
  return name ? `${name} (${code.toUpperCase()})` : code.toUpperCase();
}
