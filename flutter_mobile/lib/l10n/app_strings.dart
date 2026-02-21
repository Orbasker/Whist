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
  static String invitationFormSlotPlaceholder(int n) => 'Slot $n – Email address';
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
}
