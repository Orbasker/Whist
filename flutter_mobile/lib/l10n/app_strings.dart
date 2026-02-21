/// Copy aligned with Angular i18n (game.scoreTable, game.roundHistory, common, home, auth).
class AppStrings {
  // Auth (auth.*)
  static const signIn = 'Sign In';
  static const signUp = 'Sign Up';
  static const email = 'Email';
  static const password = 'Password';
  static const name = 'Name';
  static const enterEmail = 'Enter your email';
  static const enterPassword = 'Enter your password';
  static const enterName = 'Enter your name';
  static const emailRequired = 'Email is required';
  static const invalidEmail = 'Please enter a valid email';
  static const passwordRequired = 'Password is required';
  static const passwordMinLength = 'Password must be at least 6 characters';
  static const nameRequired = 'Name is required';
  static const signingIn = 'Signing in…';
  static const creatingAccount = 'Creating account…';
  static const noAccount = "Don't have an account?";
  static const haveAccount = 'Already have an account?';
  static const loginFailed = 'Login failed';
  static const signupFailed = 'Sign up failed';
  static const logOut = 'Log out';

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

  // Home
  static const homeTitle = 'Whist';
  static const homeSubtitle = 'Score your card game';
  static const myGames = 'My games';
  static const newGame = 'New game';
  static const loadingGames = 'Loading games…';
  static const noGames = 'No games yet';
  static const createGameToStart = 'Create a game to get started';
  static const openGame = 'Open game';
  static const round = 'Round';
  static const score = 'Score';
  static const active = 'Active';
  static const completed = 'Completed';
  static const playerNames = 'Player names';
  static const player = 'Player';
  static const startGame = 'Start game';
  static const gameNameOptional = 'Game name (optional)';
  static const gameNamePlaceholder = 'e.g. Friday night';
  static const newGameFormTitle = 'New game';
  static const creatorSeatLabel = 'Creator';
  static const gameNameDefault = 'Untitled game';
  static const createGameFailed = 'Failed to create game';
  static const mustBeLoggedIn = 'You must be logged in to create a game';
  static const authTokenMissing = 'Session expired. Please log in again.';
  static const retry = 'Retry';

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
