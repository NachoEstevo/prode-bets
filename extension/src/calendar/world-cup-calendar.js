export const WORLD_CUP_COUNTRIES = [
  { id: "mexico", name: "Mexico", group: "A" },
  { id: "south-africa", name: "South Africa", group: "A" },
  { id: "south-korea", name: "South Korea", group: "A" },
  { id: "czechia", name: "Czechia", group: "A" },
  { id: "canada", name: "Canada", group: "B" },
  { id: "switzerland", name: "Switzerland", group: "B" },
  { id: "qatar", name: "Qatar", group: "B" },
  { id: "bosnia-herzegovina", name: "Bosnia and Herzegovina", group: "B" },
  { id: "brazil", name: "Brazil", group: "C" },
  { id: "morocco", name: "Morocco", group: "C" },
  { id: "haiti", name: "Haiti", group: "C" },
  { id: "scotland", name: "Scotland", group: "C" },
  { id: "united-states", name: "United States", group: "D" },
  { id: "paraguay", name: "Paraguay", group: "D" },
  { id: "australia", name: "Australia", group: "D" },
  { id: "turkiye", name: "Turkiye", group: "D" },
  { id: "germany", name: "Germany", group: "E" },
  { id: "curacao", name: "Curacao", group: "E" },
  { id: "ivory-coast", name: "Ivory Coast", group: "E" },
  { id: "ecuador", name: "Ecuador", group: "E" },
  { id: "netherlands", name: "Netherlands", group: "F" },
  { id: "japan", name: "Japan", group: "F" },
  { id: "tunisia", name: "Tunisia", group: "F" },
  { id: "sweden", name: "Sweden", group: "F" },
  { id: "belgium", name: "Belgium", group: "G" },
  { id: "egypt", name: "Egypt", group: "G" },
  { id: "iran", name: "Iran", group: "G" },
  { id: "new-zealand", name: "New Zealand", group: "G" },
  { id: "spain", name: "Spain", group: "H" },
  { id: "cape-verde", name: "Cape Verde", group: "H" },
  { id: "saudi-arabia", name: "Saudi Arabia", group: "H" },
  { id: "uruguay", name: "Uruguay", group: "H" },
  { id: "france", name: "France", group: "I" },
  { id: "senegal", name: "Senegal", group: "I" },
  { id: "norway", name: "Norway", group: "I" },
  { id: "iraq", name: "Iraq", group: "I" },
  { id: "argentina", name: "Argentina", group: "J" },
  { id: "algeria", name: "Algeria", group: "J" },
  { id: "austria", name: "Austria", group: "J" },
  { id: "jordan", name: "Jordan", group: "J" },
  { id: "portugal", name: "Portugal", group: "K" },
  { id: "uzbekistan", name: "Uzbekistan", group: "K" },
  { id: "colombia", name: "Colombia", group: "K" },
  { id: "dr-congo", name: "DR Congo", group: "K" },
  { id: "england", name: "England", group: "L" },
  { id: "croatia", name: "Croatia", group: "L" },
  { id: "ghana", name: "Ghana", group: "L" },
  { id: "panama", name: "Panama", group: "L" }
];

export const WORLD_CUP_MATCHES = [
  {
    id: "wc2026-j-argentina-algeria",
    group: "J",
    homeCountryId: "argentina",
    awayCountryId: "algeria",
    startsAt: "2026-06-16T21:00:00-05:00",
    endsAt: "2026-06-16T23:00:00-05:00",
    timeZone: "America/Chicago",
    venue: "Kansas City Stadium"
  },
  {
    id: "wc2026-j-austria-jordan",
    group: "J",
    homeCountryId: "austria",
    awayCountryId: "jordan",
    startsAt: "2026-06-16T21:00:00-07:00",
    endsAt: "2026-06-16T23:00:00-07:00",
    timeZone: "America/Los_Angeles",
    venue: "San Francisco Bay Area Stadium"
  },
  {
    id: "wc2026-j-argentina-austria",
    group: "J",
    homeCountryId: "argentina",
    awayCountryId: "austria",
    startsAt: "2026-06-22T12:00:00-05:00",
    endsAt: "2026-06-22T14:00:00-05:00",
    timeZone: "America/Chicago",
    venue: "Dallas Stadium"
  },
  {
    id: "wc2026-j-jordan-algeria",
    group: "J",
    homeCountryId: "jordan",
    awayCountryId: "algeria",
    startsAt: "2026-06-22T20:00:00-07:00",
    endsAt: "2026-06-22T22:00:00-07:00",
    timeZone: "America/Los_Angeles",
    venue: "San Francisco Bay Area Stadium"
  },
  {
    id: "wc2026-j-jordan-argentina",
    group: "J",
    homeCountryId: "jordan",
    awayCountryId: "argentina",
    startsAt: "2026-06-27T21:00:00-05:00",
    endsAt: "2026-06-27T23:00:00-05:00",
    timeZone: "America/Chicago",
    venue: "Dallas Stadium"
  },
  {
    id: "wc2026-j-algeria-austria",
    group: "J",
    homeCountryId: "algeria",
    awayCountryId: "austria",
    startsAt: "2026-06-27T21:00:00-05:00",
    endsAt: "2026-06-27T23:00:00-05:00",
    timeZone: "America/Chicago",
    venue: "Kansas City Stadium"
  }
];

const countriesById = new Map(WORLD_CUP_COUNTRIES.map((country) => [country.id, country]));

export const getCountryById = (countryId) => countriesById.get(countryId);

export const getMatchesForCountries = (countryIds = []) => {
  const selected = new Set(countryIds);

  return WORLD_CUP_MATCHES.filter((match) =>
    selected.has(match.homeCountryId) || selected.has(match.awayCountryId)
  );
};

export const formatMatchSummary = (match) => {
  const home = getCountryById(match.homeCountryId);
  const away = getCountryById(match.awayCountryId);
  return `World Cup 2026: ${home?.name || match.homeCountryId} vs ${away?.name || match.awayCountryId}`;
};
