const DEFAULT_STRIP_MIDDLE = "#f8f4ed";

const colorFromTeam = (team, fallback) => {
  const rawColor = team?.color || fallback;
  return rawColor.startsWith("#") ? rawColor : `#${rawColor}`;
};

const competitorBySide = (competitors, side) =>
  competitors.find((competitor) => competitor.homeAway === side) || {};

const normalizeTeam = (competitor, fallbackColor) => {
  const team = competitor.team || {};
  const color = colorFromTeam(team, fallbackColor);

  return {
    id: team.id || team.abbreviation?.toLowerCase() || "team",
    name: team.displayName || team.shortDisplayName || team.abbreviation || "Team",
    colorStrip: [color, DEFAULT_STRIP_MIDDLE, color]
  };
};

export const normalizeEspnScoreboardEvent = (event) => {
  const competition = event?.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const home = normalizeTeam(competitorBySide(competitors, "home"), "#8bdcff");
  const away = normalizeTeam(competitorBySide(competitors, "away"), "#e86459");

  return {
    match: {
      id: event.id,
      title: event.name || event.shortName || `${home.name} vs ${away.name}`,
      competition: "ESPN-style mock scoreboard",
      kickoffLabel: event.status?.type?.shortDetail || "Pregame",
      marketClosesIn: "09:42",
      home,
      away
    },
    feed: {
      source: "ESPN-style mock",
      status: event.status?.type?.state || "pre",
      date: event.date
    }
  };
};
