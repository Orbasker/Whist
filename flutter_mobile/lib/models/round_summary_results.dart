/// Round summary display data (players, bids, tricks, round scores, new totals).
/// Aligned with Angular RoundSummaryResults.
class RoundSummaryResults {
  const RoundSummaryResults({
    required this.players,
    required this.bids,
    required this.tricks,
    required this.roundScores,
    required this.newTotalScores,
  });

  final List<String> players;
  final List<int> bids;
  final List<int> tricks;
  final List<int> roundScores;
  final List<int> newTotalScores;
}
