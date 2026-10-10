export const shippingCountries = [
  ['US', 'United States'], ['AU', 'Australia'], ['AT', 'Austria'], ['BH', 'Bahrain'], ['BE', 'Belgium'],
  ['CA', 'Canada'], ['CL', 'Chile'], ['DK', 'Denmark'], ['FR', 'France'], ['DE', 'Germany'],
  ['GR', 'Greece'], ['HK', 'Hong Kong'], ['HU', 'Hungary'], ['IE', 'Ireland'], ['IL', 'Israel'],
  ['IT', 'Italy'], ['JP', 'Japan'], ['KW', 'Kuwait'], ['MX', 'Mexico'], ['NL', 'Netherlands'],
  ['NZ', 'New Zealand'], ['NO', 'Norway'], ['PL', 'Poland'], ['RO', 'Romania'], ['SA', 'Saudi Arabia'],
  ['SG', 'Singapore'], ['SK', 'Slovakia'], ['ZA', 'South Africa'], ['ES', 'Spain'], ['SE', 'Sweden'],
  ['CH', 'Switzerland'], ['TH', 'Thailand'], ['GB', 'United Kingdom'],
]

export const shippingCountryCodes = new Set(shippingCountries.map(([code]) => code))
