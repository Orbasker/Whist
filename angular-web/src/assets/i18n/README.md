# Translation config (i18n)

Translations are **config-driven**: one JSON file per language. The app loads the file for the active language (e.g. `en.json`, `he.json`) and never shows raw keys to the user.

## Adding a new language

1. **Add a new JSON file** in this folder with the same structure as `en.json` or `he.json`. Use the locale code as the filename (e.g. `fr.json` for French).

2. **Copy the key structure** from `en.json` and translate the values. Keep the same keys so the app can resolve them.

3. **Register the language in the app:**
   - In `LanguageService` (`app/core/services/language.service.ts`), extend the `AppLang` type and update `getStoredLang()` / `getCurrentLang()` so the new code is accepted.
   - In the footer (or wherever the language switcher lives), add a button/option that calls `languageService.setLanguage('fr')` (or your code).

4. **Optional:** Set `dir` and `lang` in `LanguageService.applyDirectionAndLang()` for the new locale (e.g. RTL for Arabic).

No changes to components or templates are needed; they already use translation keys. New languages are added purely by adding a config file and registering the locale in the language service and switcher.
