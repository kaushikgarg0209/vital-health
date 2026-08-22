import countriesJson from "./iso3166-countries.json";

export type CountryOption = {
  code: string;
  name: string;
};

export const ISO_COUNTRIES = countriesJson as CountryOption[];

export const ISO_COUNTRY_CODES = new Set(ISO_COUNTRIES.map((country) => country.code));

export const POPULAR_COUNTRY_CODES = ["IN", "US", "GB", "CA", "AU"] as const;

export function getCountryName(code: string): string | null {
  const normalized = code.toUpperCase();
  return ISO_COUNTRIES.find((country) => country.code === normalized)?.name ?? null;
}

export function formatCountryLabel(code: string): string {
  const name = getCountryName(code);
  return name ? `${name} (${code.toUpperCase()})` : code.toUpperCase();
}

export function listCountriesForSelect(search = "") {
  const query = search.trim().toLowerCase();
  const popular = POPULAR_COUNTRY_CODES.map((code) =>
    ISO_COUNTRIES.find((country) => country.code === code),
  ).filter((country): country is CountryOption => country !== undefined);

  const filtered = ISO_COUNTRIES.filter((country) => {
    if (!query) {
      return true;
    }
    return (
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  });

  const popularCodes = new Set(POPULAR_COUNTRY_CODES);
  const remaining = filtered.filter((country) => !popularCodes.has(country.code as (typeof POPULAR_COUNTRY_CODES)[number]));

  return {
    popular: query ? popular.filter((country) =>
      country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query),
    ) : popular,
    remaining,
  };
}
