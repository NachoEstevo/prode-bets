import { formatMatchSummary, getMatchesForCountries } from "./world-cup-calendar.js";

const toIcsDate = (dateValue) =>
  new Date(dateValue).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const escapeIcsText = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const buildEvent = (match, selectedCountryIds) => [
  "BEGIN:VEVENT",
  `UID:${match.id}@prode-bets.local`,
  `DTSTAMP:${toIcsDate(Date.now())}`,
  `DTSTART:${toIcsDate(match.startsAt)}`,
  `DTEND:${toIcsDate(match.endsAt)}`,
  `SUMMARY:${escapeIcsText(formatMatchSummary(match))}`,
  `LOCATION:${escapeIcsText(match.venue)}`,
  "STATUS:CONFIRMED",
  "TRANSP:OPAQUE",
  [
    "DESCRIPTION:",
    escapeIcsText([
      "Created by Prode Bets.",
      `Selected countries: ${selectedCountryIds.join(", ")}.`,
      "Fixture data is local to this extension build; verify kickoff changes with FIFA."
    ].join("\n"))
  ].join(""),
  "END:VEVENT"
];

export const buildIcsCalendar = (selectedCountryIds = []) => {
  const matches = getMatchesForCountries(selectedCountryIds);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prode Bets//World Cup Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Prode Bets World Cup blocks",
    ...matches.flatMap((match) => buildEvent(match, selectedCountryIds)),
    "END:VCALENDAR",
    ""
  ].join("\r\n");
};

export const buildIcsFilename = (selectedCountryIds = []) => {
  const suffix = selectedCountryIds.length === 1 ? selectedCountryIds[0] : "selected-countries";
  return `prode-bets-world-cup-${suffix}.ics`;
};
