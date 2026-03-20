import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_he.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('he'),
  ];

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @you.
  ///
  /// In en, this message translates to:
  /// **'you'**
  String get you;

  /// No description provided for @confirmDelete.
  ///
  /// In en, this message translates to:
  /// **'Confirm delete'**
  String get confirmDelete;

  /// No description provided for @scoreTableTitle.
  ///
  /// In en, this message translates to:
  /// **'Score board'**
  String get scoreTableTitle;

  /// No description provided for @currentScore.
  ///
  /// In en, this message translates to:
  /// **'Current score'**
  String get currentScore;

  /// No description provided for @roundsPlayed.
  ///
  /// In en, this message translates to:
  /// **'Rounds played: {count}'**
  String roundsPlayed(int count);

  /// No description provided for @resetGame.
  ///
  /// In en, this message translates to:
  /// **'Reset game'**
  String get resetGame;

  /// No description provided for @resetDescription.
  ///
  /// In en, this message translates to:
  /// **'Reset only happens when all players vote yes.'**
  String get resetDescription;

  /// No description provided for @deleteGame.
  ///
  /// In en, this message translates to:
  /// **'Delete game'**
  String get deleteGame;

  /// No description provided for @roundHistoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Score board'**
  String get roundHistoryTitle;

  /// No description provided for @roundsEmpty.
  ///
  /// In en, this message translates to:
  /// **'No rounds yet'**
  String get roundsEmpty;

  /// No description provided for @roundCol.
  ///
  /// In en, this message translates to:
  /// **'Round'**
  String get roundCol;

  /// No description provided for @cardCol.
  ///
  /// In en, this message translates to:
  /// **'Card'**
  String get cardCol;

  /// No description provided for @bidCol.
  ///
  /// In en, this message translates to:
  /// **'Bid'**
  String get bidCol;

  /// No description provided for @tookCol.
  ///
  /// In en, this message translates to:
  /// **'Took'**
  String get tookCol;

  /// No description provided for @changeCol.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get changeCol;

  /// No description provided for @beforeCol.
  ///
  /// In en, this message translates to:
  /// **'Before'**
  String get beforeCol;

  /// No description provided for @afterCol.
  ///
  /// In en, this message translates to:
  /// **'After'**
  String get afterCol;

  /// No description provided for @total.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get total;

  /// No description provided for @confirmDeleteGame.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this game?'**
  String get confirmDeleteGame;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @refresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get refresh;

  /// No description provided for @noGameLoaded.
  ///
  /// In en, this message translates to:
  /// **'No game loaded. Create or join a game on the web app.'**
  String get noGameLoaded;

  /// No description provided for @roundHistoryTooltip.
  ///
  /// In en, this message translates to:
  /// **'Round history'**
  String get roundHistoryTooltip;

  /// No description provided for @scoreTableTooltip.
  ///
  /// In en, this message translates to:
  /// **'Score table'**
  String get scoreTableTooltip;

  /// No description provided for @appBarTitleRounds.
  ///
  /// In en, this message translates to:
  /// **'Score board · {count} rounds'**
  String appBarTitleRounds(int count);

  /// No description provided for @gameLabel.
  ///
  /// In en, this message translates to:
  /// **'Game'**
  String get gameLabel;

  /// No description provided for @playersLabel.
  ///
  /// In en, this message translates to:
  /// **'Players'**
  String get playersLabel;

  /// No description provided for @currentScoresLabel.
  ///
  /// In en, this message translates to:
  /// **'Current scores'**
  String get currentScoresLabel;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @hebrew.
  ///
  /// In en, this message translates to:
  /// **'Hebrew'**
  String get hebrew;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @liveUpdatesConnected.
  ///
  /// In en, this message translates to:
  /// **'Live updates connected'**
  String get liveUpdatesConnected;

  /// No description provided for @realtimeDisconnected.
  ///
  /// In en, this message translates to:
  /// **'Realtime disconnected'**
  String get realtimeDisconnected;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Whist'**
  String get appTitle;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'he'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'he':
      return AppLocalizationsHe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
