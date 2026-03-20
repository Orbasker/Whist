// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hebrew (`he`).
class AppLocalizationsHe extends AppLocalizations {
  AppLocalizationsHe([String locale = 'he']) : super(locale);

  @override
  String get close => 'סגור';

  @override
  String get cancel => 'ביטול';

  @override
  String get delete => 'מחק';

  @override
  String get you => 'אתה';

  @override
  String get confirmDelete => 'אישור מחיקה';

  @override
  String get scoreTableTitle => 'לוח ניקוד';

  @override
  String get currentScore => 'ניקוד נוכחי';

  @override
  String roundsPlayed(int count) {
    return 'סיבובים שבוצעו: $count';
  }

  @override
  String get resetGame => 'איפוס משחק';

  @override
  String get resetDescription => 'איפוס מתבצע רק כאשר כל השחקנים מצביעים כן.';

  @override
  String get deleteGame => 'מחק משחק';

  @override
  String get roundHistoryTitle => 'לוח ניקוד';

  @override
  String get roundsEmpty => 'אין סיבובים עדיין';

  @override
  String get roundCol => 'סיבוב';

  @override
  String get cardCol => 'קלף';

  @override
  String get bidCol => 'הצעה';

  @override
  String get tookCol => 'לקח';

  @override
  String get changeCol => 'שינוי';

  @override
  String get beforeCol => 'לפני';

  @override
  String get afterCol => 'אחרי';

  @override
  String get total => 'סה\"כ';

  @override
  String get confirmDeleteGame => 'האם אתה בטוח שברצונך למחוק את המשחק?';

  @override
  String get retry => 'נסה שוב';

  @override
  String get refresh => 'רענן';

  @override
  String get noGameLoaded =>
      'אין משחק טעון. צור או הצטרף למשחק באפליקציית האינטרנט.';

  @override
  String get roundHistoryTooltip => 'היסטוריית סיבובים';

  @override
  String get scoreTableTooltip => 'טבלת ניקוד';

  @override
  String appBarTitleRounds(int count) {
    return 'לוח ניקוד · $count סיבובים';
  }

  @override
  String get gameLabel => 'משחק';

  @override
  String get playersLabel => 'שחקנים';

  @override
  String get currentScoresLabel => 'ניקוד נוכחי';

  @override
  String get unnamedGame => 'משחק ללא שם';

  @override
  String get liveUpdatesConnected => 'עדכונים חיים מחוברים';

  @override
  String get realtimeDisconnected => 'החיבור לעדכונים נותק';

  @override
  String get language => 'שפה';

  @override
  String get hebrew => 'עברית';

  @override
  String get english => 'English';

  @override
  String get appTitle => 'וויסט';
}
