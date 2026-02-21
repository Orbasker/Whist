/// Copy aligned with Angular i18n (game.scoreTable, game.roundHistory, common, home).
class AppStrings {
  // Common
  static const close = 'Close';
  static const cancel = 'Cancel';
  static const delete = 'Delete';
  static const you = 'you';
  static const confirmDelete = 'Confirm delete';

  // Score table (game.scoreTable)
  static const scoreTableTitle = 'Score board';
  static const currentScore = 'Current score';
  static const roundsPlayed = 'Rounds played: %s';
  static const resetGame = 'Reset game';
  static const resetDescription = 'Reset only happens when all players vote yes.';
  static const deleteGame = 'Delete game';

  // Round history (game.roundHistory, game.roundHistoryTable)
  static const roundHistoryTitle = 'Score board';
  static const roundsEmpty = 'No rounds yet';
  static const roundCol = 'Round';
  static const cardCol = 'Card';
  static const bidCol = 'Bid';
  static const tookCol = 'Took';
  static const changeCol = 'Change';
  static const beforeCol = 'Before';
  static const afterCol = 'After';
  static const total = 'Total';

  // Home / delete
  static const confirmDeleteGame = 'Are you sure you want to delete this game?';

  // Tricks phase (game.tricksPhase)
  static const tricksPhaseQuestion = 'How many tricks did each player actually take?';
  static const tricksPhaseTotalTricks = 'Total tricks';
  static const tricksPhaseTricks = 'tricks';
  static const tricksPhaseBid = 'Bid';
  static const tricksPhaseLockChoice = 'Lock choice';
  static const tricksPhaseLockPlayerChoice = 'Lock player choice';
  static const tricksPhaseFinishRound = 'Finish round';
  static String tricksPhaseValidationMissing(int n) => '$n tricks missing';
  static String tricksPhaseValidationExtra(int n) => '$n tricks extra';

  // Round summary (game.roundSummary)
  static const roundSummaryTitle = 'Round summary';
  static String roundSummaryBidTook(int bid, int took) => 'Bid $bid, took $took';
  static const roundSummaryContinueNext = 'Continue to next round';

  // Game phase
  static const gameBidding = 'Bidding';
  static const gameTricks = 'Tricks';
}
