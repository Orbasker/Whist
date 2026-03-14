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
/// 4. Neon Auth processes OAuth, sets session cookies, redirects to callback.
/// 5. We navigate to auth domain's `/get-session` and read the session JSON.
/// 6. Extract the JWT and return it.
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
  String? _pendingVerifier;

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
        onNavigationRequest: (request) {
          // Force Google to show the account picker.
          if (request.url.contains('accounts.google.com') &&
              request.url.contains('/o/oauth2/') &&
              !request.url.contains('prompt=')) {
            final newUrl = '${request.url}&prompt=select_account';
            debugPrint('[OAuth] forcing account picker');
            Future.microtask(() => _controller.loadRequest(Uri.parse(newUrl)));
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageStarted: (url) {
          if (mounted) setState(() => _isLoading = true);
          // Only show the WebView when on Google's sign-in page.
          if (url.contains('google.com')) {
            if (mounted && !_showWebView) setState(() => _showWebView = true);
          } else if (_showWebView) {
            if (mounted) setState(() => _showWebView = false);
          }
        },
        onPageFinished: (url) {
          if (mounted) setState(() => _isLoading = false);
          debugPrint('[OAuth] page finished: $url');

          // Step 2: First time auth domain loads → inject OAuth fetch.
          if (!_fetchInjected && url.startsWith(_authBaseUrl)) {
            _fetchInjected = true;
            _injectOAuthFetch();
            return;
          }

          // Callback URL loaded — extract the verifier, then navigate to
          // the auth domain so the fetch is same-origin (cookies included).
          if (!_done && url.startsWith(_callbackUrl)) {
            _done = true;
            final uri = Uri.parse(url);
            _pendingVerifier =
                uri.queryParameters['neon_auth_session_verifier'];
            debugPrint(
                '[OAuth] callback reached, verifier=${_pendingVerifier != null}');
            // Navigate to auth domain — onPageFinished will trigger the fetch.
            _controller.loadRequest(Uri.parse('$_authBaseUrl/get-session'));
            return;
          }

          // Auth domain loaded after callback — now do the verifier exchange
          // same-origin so challenge cookie is included.
          if (_done && _fetchInjected && url.startsWith(_authBaseUrl)) {
            debugPrint('[OAuth] on auth domain, exchanging verifier...');
            _exchangeVerifierViaFetch(_pendingVerifier);
          }
        },
        onWebResourceError: (error) {
          // On real device, localhost callback is unreachable.
          // Extract the verifier and navigate to auth domain.
          if (!_done &&
              error.url != null &&
              error.url!.startsWith(_callbackUrl)) {
            _done = true;
            final uri = Uri.parse(error.url!);
            _pendingVerifier =
                uri.queryParameters['neon_auth_session_verifier'];
            debugPrint(
                '[OAuth] callback unreachable, navigating to auth domain...');
            _controller.loadRequest(Uri.parse('$_authBaseUrl/get-session'));
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

  // ── Exchange session verifier via fetch (replicates Better Auth client) ──

  void _exchangeVerifierViaFetch(String? verifier) {
    final sessionUrl = verifier != null && verifier.isNotEmpty
        ? '$_authBaseUrl/get-session?neon_auth_session_verifier=$verifier'
        : '$_authBaseUrl/get-session';
    // Step 1: Exchange verifier to establish session (sets cookies).
    // Step 2: Fetch /token to get the JWT.
    _controller.runJavaScript('''
window._oauthResult = "";
fetch("$sessionUrl", {
  method: "GET",
  credentials: "include"
}).then(function(r) { return r.json(); })
  .then(function(session) {
    if (!session || !session.session) {
      window._oauthResult = "ERROR:no session";
      return;
    }
    // Session established — now fetch the JWT.
    return fetch("$_authBaseUrl/token", {
      method: "GET",
      credentials: "include"
    }).then(function(r) { return r.text(); })
      .then(function(t) { window._oauthResult = t; });
  })
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
            '[OAuth] result: ${body.substring(0, body.length.clamp(0, 200))}');

        if (body.startsWith('ERROR:') || body == 'null' || body.length < 10) {
          debugPrint('[OAuth] fetch failed or empty: $body');
          _finish(null);
          return;
        }

        _finish(body);
        return;
      } catch (_) {}
    }
    debugPrint('[OAuth] polling timed out');
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.continueWithGoogle),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(null),
        ),
      ),
      body: Stack(
        children: [
          // WKWebView is a platform view — Opacity doesn't hide it.
          // Use Offstage to fully remove it from rendering when not needed.
          Offstage(
            offstage: !_showWebView,
            child: WebViewWidget(controller: _controller),
          ),
          if (_isLoading || !_showWebView)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
