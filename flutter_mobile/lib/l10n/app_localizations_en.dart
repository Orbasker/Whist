// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get close => 'Close';

  @override
  String get cancel => 'Cancel';

  @override
  String get delete => 'Delete';

  @override
  String get you => 'you';

  @override
  String get confirmDelete => 'Confirm delete';

  @override
  String get scoreTableTitle => 'Score board';

  @override
  String get currentScore => 'Current score';

  @override
  String roundsPlayed(int count) {
    return 'Rounds played: $count';
  }

  @override
  String get resetGame => 'Reset game';

  @override
  String get resetDescription =>
      'Reset only happens when all players vote yes.';

  @override
  String get deleteGame => 'Delete game';

  @override
  String get roundHistoryTitle => 'Score board';

  @override
  String get roundsEmpty => 'No rounds yet';

  @override
  String get roundCol => 'Round';

  @override
  String get cardCol => 'Card';

  @override
  String get bidCol => 'Bid';

  @override
  String get tookCol => 'Took';

  @override
  String get changeCol => 'Change';

  @override
  String get beforeCol => 'Before';

  @override
  String get afterCol => 'After';

  @override
  String get total => 'Total';

  @override
  String get confirmDeleteGame => 'Are you sure you want to delete this game?';

  @override
  String get retry => 'Retry';

  @override
  String get refresh => 'Refresh';

  @override
  String get noGameLoaded =>
      'No game loaded. Create or join a game on the web app.';

  @override
  String get roundHistoryTooltip => 'Round history';

  @override
  String get scoreTableTooltip => 'Score table';

  @override
  String appBarTitleRounds(int count) {
    return 'Score board · $count rounds';
  }

  @override
  String get gameLabel => 'Game';

  @override
  String get playersLabel => 'Players';

  @override
  String get currentScoresLabel => 'Current scores';

  @override
  String get unnamedGame => 'Unnamed game';

  @override
  String get liveUpdatesConnected => 'Live updates connected';

  @override
  String get realtimeDisconnected => 'Realtime disconnected';

  @override
  String get language => 'Language';

  @override
  String get hebrew => 'Hebrew';

  @override
  String get english => 'English';

  @override
  String get appTitle => 'Whist';
}
