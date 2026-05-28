const toScoreNumber = (value) => {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
};

const compactTeam = (team, score) => ({
  id: team?.id || "",
  name: team?.name || "",
  flagAsset: team?.flagAsset || "",
  score
});

export const buildGoalAlert = ({ previousMatch, currentMatch }) => {
  if (!previousMatch || !currentMatch) {
    return null;
  }

  const previousHomeScore = toScoreNumber(previousMatch.home?.score);
  const previousAwayScore = toScoreNumber(previousMatch.away?.score);
  const currentHomeScore = toScoreNumber(currentMatch.home?.score);
  const currentAwayScore = toScoreNumber(currentMatch.away?.score);
  const previousTotal = previousHomeScore + previousAwayScore;
  const currentTotal = currentHomeScore + currentAwayScore;

  if (currentTotal <= previousTotal) {
    return null;
  }

  const homeDelta = currentHomeScore - previousHomeScore;
  const awayDelta = currentAwayScore - previousAwayScore;
  const scoringSide = awayDelta > homeDelta ? "away" : "home";
  const scoringTeam = scoringSide === "away" ? currentMatch.away : currentMatch.home;

  return {
    type: "goal",
    matchId: currentMatch.id,
    matchTitle: currentMatch.title,
    scoringSide,
    scoringTeamName: scoringTeam?.name || "Goal",
    scoreLabel: `${currentHomeScore} - ${currentAwayScore}`,
    home: compactTeam(currentMatch.home, currentHomeScore),
    away: compactTeam(currentMatch.away, currentAwayScore)
  };
};

export const buildDemoGoalAlert = (match, { scoringTeamId } = {}) => {
  const scoringSide = scoringTeamId && scoringTeamId === match?.away?.id ? "away" : "home";
  const previousMatch = {
    ...match,
    home: { ...match.home, score: toScoreNumber(match.home?.score) },
    away: { ...match.away, score: toScoreNumber(match.away?.score) }
  };
  const currentMatch = {
    ...previousMatch,
    [scoringSide]: {
      ...previousMatch[scoringSide],
      score: toScoreNumber(previousMatch[scoringSide]?.score) + 1
    }
  };

  return buildGoalAlert({ previousMatch, currentMatch });
};
