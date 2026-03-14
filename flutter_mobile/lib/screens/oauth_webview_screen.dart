import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config/auth_config.dart';
import '../l10n/app_strings.dart';

/// Opens a WebView for OAuth social sign-in via Neon Auth.
///
/// Flow:
/// 1. Navigate to the Neon Auth domain to establish origin.
/// 2. JS fetch POSTs to `/sign-in/social` → gets redirect URL to Google.
/// 3. User completes Google OAuth in the WebView.
/// 4. Neon Auth redirects to callback URL (localhost Angular app).
/// 5. Angular's Better Auth client processes the session verifier,
///    exchanges it for a JWT, and stores it in localStorage.
/// 6. We read the JWT from localStorage and return it.
class OAuthWebViewScreen extends StatefulWidget {
  const OAuthWebViewScreen({super.key, required this.provider});

  final String provider;

  @override
  State<OAuthWebViewScreen> createState() => _OAuthWebViewScreenState();
}

class _OAuthWebViewScreenState extends State<OAuthWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _done = false;
  bool _fetchInjected = false;
  bool _showWebView = false;

  String get _authBaseUrl => AuthConfig.authBaseUrl;
  String get _callbackUrl => '${AuthConfig.webAppOrigin}/login';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) '
        'Version/18.0 Mobile/15E148 Safari/604.1',
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (url) {
          if (mounted) setState(() => _isLoading = true);
          // Only show the WebView when on Google's sign-in page.
          if (url.contains('google.com')) {
            if (mounted && !_showWebView) setState(() => _showWebView = true);
          }
          // Hide the WebView once we leave Google (callback redirect).
          if (_showWebView && url.startsWith(_callbackUrl)) {
            if (mounted) setState(() => _showWebView = false);
          }
        },
        onPageFinished: (url) {
          if (mounted) setState(() => _isLoading = false);

          // Step 2: First time auth domain loads → inject OAuth fetch.
          if (!_fetchInjected && url.startsWith(_authBaseUrl)) {
            _fetchInjected = true;
            _injectOAuthFetch();
            return;
          }

          // Step 5: Callback URL loaded — the Angular app + Better Auth client
          // will process the session verifier and store the JWT in localStorage.
          // Poll localStorage until we find the token.
          if (!_done && url.startsWith(_callbackUrl)) {
            _done = true;
            debugPrint(
                '[OAuth] callback loaded, polling localStorage for JWT...');
            _pollLocalStorageForToken();
          }
        },
        onWebResourceError: (error) {
          // On real device, localhost unreachable → try auth domain directly.
          if (!_done &&
              error.url != null &&
              error.url!.startsWith(_callbackUrl)) {
            debugPrint('[OAuth] callback unreachable, trying auth domain');
            _done = true;
            _fetchTokenViaAuthDomain();
          }
        },
      ))
      // Step 1: Navigate to auth domain to establish origin.
      ..loadRequest(Uri.parse('$_authBaseUrl/get-session'));
  }

  // ── Step 2: Inject OAuth fetch ────────────────────────────────────────

  void _injectOAuthFetch() {
    final endpoint = '$_authBaseUrl/sign-in/social';
    final payload = jsonEncode({
      'provider': widget.provider,
      'callbackURL': _callbackUrl,
    });
    _controller.runJavaScript('''
document.body.innerText = "";
fetch("$endpoint", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: '$payload',
  redirect: "follow",
  credentials: "include"
}).then(function(r) {
  if (r.redirected) {
    window.location.href = r.url;
  } else {
    return r.json().then(function(d) {
      if (d.url) { window.location.href = d.url; }
      else { document.body.innerText = JSON.stringify(d); }
    });
  }
}).catch(function(e) { document.body.innerText = e.toString(); });
''');
  }

  // ── Step 5/6: Poll localStorage for the JWT ───────────────────────────

  Future<void> _pollLocalStorageForToken() async {
    // The Better Auth client on the Angular page processes the session verifier
    // and stores the JWT. Give it time, then poll.
    for (int i = 0; i < 40; i++) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;
      try {
        // Check localStorage for the token (Better Auth / Neon Auth stores it here).
        final raw = await _controller.runJavaScriptReturningResult('''
(function() {
  var keys = ['neon-auth.session_token', 'better-auth.session_token', 'session_token'];
  for (var i = 0; i < keys.length; i++) {
    var v = localStorage.getItem(keys[i]);
    if (v && v.length > 50 && v.indexOf('eyJ') === 0) return v;
  }
  // Also check all localStorage keys for any JWT.
  for (var j = 0; j < localStorage.length; j++) {
    var key = localStorage.key(j);
    var val = localStorage.getItem(key);
    if (val && val.length > 50 && val.indexOf('eyJ') === 0) return val;
  }
  return "";
})()
''');
        final token = _unescapeJs(raw.toString());
        if (token.isNotEmpty && _isJwt(token)) {
          debugPrint('[OAuth] found JWT in localStorage after ${i * 500}ms');
          _finish(jsonEncode({'token': token}));
          return;
        }

        // Also try cookies.
        final cookieRaw = await _controller.runJavaScriptReturningResult(
          'document.cookie',
        );
        final cookies = _unescapeJs(cookieRaw.toString());
        final cookieJwt = _findJwtInString(cookies);
        if (cookieJwt != null) {
          debugPrint('[OAuth] found JWT in cookies after ${i * 500}ms');
          _finish(jsonEncode({'token': cookieJwt}));
          return;
        }
      } catch (e) {
        debugPrint('[OAuth] poll error: $e');
      }
    }

    // Polling failed — try fetching from auth domain as last resort.
    debugPrint('[OAuth] localStorage polling timed out, trying auth domain...');
    _fetchTokenViaAuthDomain();
  }

  // ── Fallback: Navigate to auth domain and fetch /token ────────────────

  void _fetchTokenViaAuthDomain() {
    _controller.runJavaScript('''
window._oauthResult = "";
fetch("$_authBaseUrl/token", {
  method: "GET",
  credentials: "include"
}).then(function(r) { return r.text(); })
  .then(function(t) { window._oauthResult = t; })
  .catch(function(e) { window._oauthResult = "ERROR:" + e.toString(); });
''');
    _pollForResult();
  }

  Future<void> _pollForResult() async {
    for (int i = 0; i < 20; i++) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;
      try {
        final raw = await _controller.runJavaScriptReturningResult(
          'window._oauthResult || ""',
        );
        final body = _unescapeJs(raw.toString());
        if (body.isEmpty) continue;

        debugPrint(
            '[OAuth] auth domain result: ${body.substring(0, body.length.clamp(0, 200))}');

        if (body.startsWith('ERROR:') || body == 'null' || body.length < 10) {
          _finish(null);
          return;
        }

        _finish(body);
        return;
      } catch (_) {}
    }
    _finish(null);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  void _finish(String? result) {
    if (mounted) Navigator.of(context).pop(result);
  }

  String _unescapeJs(String s) {
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.substring(1, s.length - 1);
      s = s
          .replaceAll(r'\"', '"')
          .replaceAll(r'\\', r'\')
          .replaceAll(r'\n', '\n');
    }
    return s;
  }

  bool _isJwt(String s) =>
      s.length > 50 && s.startsWith('eyJ') && s.contains('.');

  String? _findJwtInString(String s) {
    final match = RegExp(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
        .firstMatch(s);
    return match?.group(0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.continueWithGoogle),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(null),
        ),
      ),
      body: Stack(
        children: [
          Opacity(
            opacity: _showWebView ? 1.0 : 0.0,
            child: WebViewWidget(controller: _controller),
          ),
          if (_isLoading || !_showWebView)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
