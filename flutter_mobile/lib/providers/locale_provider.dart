import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _storageKey = 'whist_lang';

Locale _localeFromCode(String code) {
  return code == 'en' ? const Locale('en') : const Locale('he');
}

/// Supported app locales. Aligned with web (LanguageService: he | en).
enum AppLocale {
  he(Locale('he')),
  en(Locale('en'));

  const AppLocale(this.locale);
  final Locale locale;
}

/// Holds current [Locale], persists to SharedPreferences (key: whist_lang).
class LocaleProvider extends ChangeNotifier {
  LocaleProvider(this._prefs)
    : _locale = _localeFromCode(_prefs.getString(_storageKey) ?? 'he');

  final SharedPreferences _prefs;
  Locale _locale;

  Locale get locale => _locale;

  AppLocale get appLocale =>
      _locale.languageCode == 'en' ? AppLocale.en : AppLocale.he;

  bool get isRtl => _locale.languageCode == 'he';

  Future<void> setLocale(AppLocale appLocale) async {
    if (_locale == appLocale.locale) return;
    _locale = appLocale.locale;
    await _prefs.setString(_storageKey, _locale.languageCode);
    notifyListeners();
  }

  static Future<LocaleProvider> create() async {
    final prefs = await SharedPreferences.getInstance();
    return LocaleProvider(prefs);
  }
}
