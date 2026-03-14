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

  /// Generic fallback when no message from server (aligned with auth.loginFailed).
  static const loginFailed = 'Login failed';

  /// Same as Angular auth.loginFailed – wrong password / invalid credentials.
  static const loginFailedCheckCredentials =
      'Login failed. Please check your credentials.';

  /// Aligned with Angular auth.signupFailed.
  static const signupFailed = 'Signup failed. Please try again.';
  static const logOut = 'Log out';
  static const continueWithGoogle = 'Continue with Google';
  static const connecting = 'Connecting…';
  static const googleSignInFailed = 'Google sign-in failed';

  /// OAuth / generic auth failure (aligned with auth.authFailed).
  static const authFailed = 'Authentication failed. Please try again.';

  /// Invalid request (aligned with auth.invalidRequest).
  static const invalidRequest =
      'Invalid request. Please check your configuration.';

  /// Email not verified (consistent with web).
  static const emailNotVerified =
      'Email not verified. Please check your inbox.';
  static const or = 'Or';

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
  static const resetDescription =
      'Reset only happens when all players vote yes.';
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

  // Invitation form (aligned with Angular invitationForm / home)
  static const invite = 'Invite';
  static const sendInvitations = 'Send invitations';
  static const invitationFormGameFull =
      'Game is full. No slots available for invitation.';
  static const invitationFormTitle = 'Send game invitations';
  static const invitationFormEnterEmails =
      'Enter email addresses for available slots';
  static const invitationFormPlayersInGame = 'Players in game';
  static String invitationFormPlayerLabel(int n, String name) =>
      'Player $n: $name';
  static String invitationFormSlotPlaceholder(int n) =>
      'Slot $n – Email address';
  static const invitationFormInvalidEmail = 'Invalid email';
  static const invitationFormSendInvitations = 'Send invitations';
  static const invitationFormSending = 'Sending...';
  static const invitationFormAtLeastOneEmail =
      'Please enter at least one valid email address';
  static const invitationFormGameIdMissing = 'Game ID is missing';
  static const invitationFormSendError = 'Error sending invitations';
  static String invitationsSentSuccess(int sent, int total) =>
      '$sent of $total invitations sent successfully!';
  static const invitationsSendFailed =
      "We couldn't send the invitations. Please try again.";

  // Bidding phase (game.biddingPhase)
  static const biddingPhaseTitle = 'Bids';
  static const biddingPhaseSubtitle = 'Choose trump and bid for each player';
  static const biddingPhaseTrump = 'Trump';
  static const biddingPhaseTotalBids = 'Total bids';
  static const biddingPhaseCannotBid13 =
      'Cannot bid exactly 13 - must be over or under';
  static String biddingPhaseUnderMode(int diff) =>
      'Under mode - $diff tricks short';
  static String biddingPhaseOverMode(int diff) =>
      'Over mode - $diff tricks extra';
  static const biddingPhaseManager = 'Manager';
  static const biddingPhaseYou = '(you)';
  static const biddingPhaseLocked = 'Locked';
  static const biddingPhaseChoice = '(choice)';
  static const biddingPhaseTricks = 'tricks';
  static const biddingPhaseCannotEdit =
      'Cannot edit - user not identified in game';
  static const biddingPhaseLockChoice = 'Lock choice';
  static const biddingPhaseLockPlayerChoice = 'Lock player choice';
  static const biddingPhaseContinue = 'Continue';

  // Trump options (trump.*)
  static const trumpNoTrump = 'No trump';
  static const trumpSpades = 'Spades';
  static const trumpClubs = 'Clubs';
  static const trumpDiamonds = 'Diamonds';
  static const trumpHearts = 'Hearts';

  // Tricks phase (game.tricksPhase)
  static const tricksPhaseQuestion =
      'How many tricks did each player actually take?';
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
  static String roundSummaryBidTook(int bid, int took) =>
      'Bid $bid, took $took';
  static const roundSummaryContinueNext = 'Continue to next round';

  // Game phase
  static const gameBidding = 'Bidding';
  static const gameTricks = 'Tricks';
}
