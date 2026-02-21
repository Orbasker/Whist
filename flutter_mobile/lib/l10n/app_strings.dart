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

  // Bidding phase (game.biddingPhase)
  static const biddingPhaseTitle = 'Bids';
  static const biddingPhaseSubtitle = 'Choose trump and bid for each player';
  static const biddingPhaseTrump = 'Trump';
  static const biddingPhaseTotalBids = 'Total bids';
  static const biddingPhaseCannotBid13 = 'Cannot bid exactly 13 - must be over or under';
  static String biddingPhaseUnderMode(int diff) => 'Under mode - $diff tricks short';
  static String biddingPhaseOverMode(int diff) => 'Over mode - $diff tricks extra';
  static const biddingPhaseManager = 'Manager';
  static const biddingPhaseYou = '(you)';
  static const biddingPhaseLocked = 'Locked';
  static const biddingPhaseChoice = '(choice)';
  static const biddingPhaseTricks = 'tricks';
  static const biddingPhaseCannotEdit = 'Cannot edit - user not identified in game';
  static const biddingPhaseLockChoice = 'Lock choice';
  static const biddingPhaseLockPlayerChoice = 'Lock player choice';
  static const biddingPhaseContinue = 'Continue';

  // Trump options (trump.*)
  static const trumpNoTrump = 'No trump';
  static const trumpSpades = 'Spades';
  static const trumpClubs = 'Clubs';
  static const trumpDiamonds = 'Diamonds';
  static const trumpHearts = 'Hearts';
}
