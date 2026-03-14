import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

/// Parses Neon Auth API response shapes (token + user). Matches Angular AuthService paths.
/// Exposed for unit tests; used by [AuthService].
class NeonAuthResponseParser {
  NeonAuthResponseParser._();

  static bool _isJwt(String s) =>
      s.length > 50 && s.startsWith('eyJ') && s.contains('.');

  static String? _findJwtInMap(Map<String, dynamic> m) {
    for (final value in m.values) {
      if (value is String && _isJwt(value)) return value;
      if (value is Map<String, dynamic>) {
        final found = _findJwtInMap(value);
        if (found != null) return found;
      }
    }
    return null;
  }

  /// Extracts JWT from auth response body. Path order matches Angular getToken():
  /// data.session.token, data.session.accessToken, data.token, session.token, token, then deep search.
  static String? extractToken(String body) {
    try {
      final data = jsonDecode(body);
      if (data is! Map<String, dynamic>) return null;

      final dataSession = data['data'];
      if (dataSession is Map<String, dynamic>) {
        final session = dataSession['session'];
        if (session is Map<String, dynamic>) {
          final t = session['token'] ?? session['accessToken'];
          if (t is String && _isJwt(t)) return t;
        }
        final t = dataSession['token'];
        if (t is String && _isJwt(t)) return t;
      }

      final session = data['session'];
      if (session is Map<String, dynamic>) {
        final t = session['token'] ?? session['accessToken'];
        if (t is String && _isJwt(t)) return t;
      }

      final t = data['token'];
      if (t is String && _isJwt(t)) return t;

      return _findJwtInMap(data);
    } catch (_) {
      return null;
    }
  }

  /// Parses user from get-session/sign-in response. Matches Angular: session.data.user (data.user).
  static AuthUser? parseUser(dynamic data) {
    if (data is! Map<String, dynamic>) return null;
    final user = data['data']?['user'] ?? data['user'];
    if (user is Map<String, dynamic>) return AuthUser.fromJson(user);
    return null;
  }
}

/// Neon Auth (Better Auth) session user.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    this.name,
  });

  final String id;
  final String email;
  final String? name;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      name: json['name'] as String?,
    );
  }
}

/// Neon Auth (Better Auth) client: sign-in, sign-up, sign-out, token storage.
/// Uses same API as Angular: authUrl/sign-in/email, sign-up/email, get-session, sign-out.
class AuthService extends ChangeNotifier {
  AuthService({
    required this.authBaseUrl,
    FlutterSecureStorage? secureStorage,
  }) : _storage = secureStorage ?? const FlutterSecureStorage();

  final String authBaseUrl;
  final FlutterSecureStorage _storage;

  static const _tokenKey = 'neon-auth.session_token';

  String? _cachedToken;
  AuthUser? _cachedUser;
  bool _initialLoadDone = false;

  /// Whether the first load from storage has completed (so we can show auth vs game).
  bool get initialLoadDone => _initialLoadDone;

  /// Current JWT for API calls. Null if not signed in.
  String? get token => _cachedToken;

  /// Current user if signed in.
  AuthUser? get user => _cachedUser;

  /// Whether the user is authenticated (has a stored or cached token).
  bool get isAuthenticated => _cachedToken != null && _cachedToken!.isNotEmpty;

  /// Initialize from secure storage (call on app start).
  Future<void> loadSession() async {
    final stored = await _storage.read(key: _tokenKey);
    if (stored != null && stored.isNotEmpty && _isJwt(stored)) {
      _cachedToken = stored;
      await _fetchSessionUser();
    } else {
      _cachedToken = null;
      _cachedUser = null;
      if (stored != null) await _storage.delete(key: _tokenKey);
    }
    _initialLoadDone = true;
    notifyListeners();
  }

  /// Sign in with email and password.
  Future<void> signIn(String email, String password) async {
    final res = await http.post(
      Uri.parse('$authBaseUrl/sign-in/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    _checkAuthResponse(res);
    await _persistSessionFromResponse(res.body);
  }

  /// Sign up with email, password, and name.
  Future<void> signUp(String email, String password, String name) async {
    final res = await http.post(
      Uri.parse('$authBaseUrl/sign-up/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'name': name,
      }),
    );
    _checkAuthResponse(res);
    await _persistSessionFromResponse(res.body);
  }

  /// Sign in with Google (Neon Auth / Better Auth sign-in/social with idToken).
  /// Uses native Google Sign-In, then exchanges idToken for session.
  Future<void> signInWithGoogle() async {
    final googleSignIn = GoogleSignIn(
      scopes: ['email', 'profile'],
    );
    final account = await googleSignIn.signIn();
    if (account == null) return; // User cancelled
    final auth = await account.authentication;
    final idToken = auth.idToken;
    final accessToken = auth.accessToken;
    if (idToken == null || idToken.isEmpty) {
      throw AuthException(0, 'Google sign-in did not return an ID token');
    }
    final res = await http.post(
      Uri.parse('$authBaseUrl/sign-in/social'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'provider': 'google',
        'idToken': {
          'token': idToken,
          if (accessToken != null && accessToken.isNotEmpty)
            'accessToken': accessToken,
        },
      }),
    );
    _checkAuthResponse(res);
    await _persistSessionFromResponse(res.body);
  }

  /// Sign out: clear server session and local token.
  Future<void> signOut() async {
    final t = _cachedToken;
    if (t != null && t.isNotEmpty) {
      try {
        await http.post(
          Uri.parse('$authBaseUrl/sign-out'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $t',
          },
        );
      } catch (_) {
        // Ignore; we still clear local state
      }
    }
    _cachedToken = null;
    _cachedUser = null;
    await _storage.delete(key: _tokenKey);
    notifyListeners();
  }

  /// Get current JWT for API client. Returns null if not authenticated.
  Future<String?> getToken() async {
    if (_cachedToken != null) return _cachedToken;
    await loadSession();
    return _cachedToken;
  }

  /// Fetch current session from auth server (and refresh user cache).
  Future<bool> refreshSession() async {
    final t = _cachedToken;
    if (t == null || t.isEmpty) return false;
    try {
      final res = await http.get(
        Uri.parse('$authBaseUrl/get-session'),
        headers: {'Authorization': 'Bearer $t'},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _cachedUser = _parseUser(data);
        return true;
      }
    } catch (_) {
      // Session may be expired
    }
    return false;
  }

  void _checkAuthResponse(http.Response res) {
    if (res.statusCode >= 400) {
      String msg = res.body;
      try {
        final m = jsonDecode(res.body) as Map<String, dynamic>;
        msg = (m['message'] ?? m['error'] ?? res.body) as String? ?? res.body;
      } catch (_) {}
      throw AuthException(res.statusCode, msg);
    }
  }

  Future<void> _persistSessionFromResponse(String body) async {
    final token = _extractTokenFromBody(body);
    if (token == null || token.isEmpty) {
      throw AuthException(0, 'No session token in response');
    }
    await _storage.write(key: _tokenKey, value: token);
    _cachedToken = token;
    await _fetchSessionUser();
    notifyListeners();
  }

  Future<void> _fetchSessionUser() async {
    final t = _cachedToken;
    if (t == null) return;
    try {
      final res = await http.get(
        Uri.parse('$authBaseUrl/get-session'),
        headers: {'Authorization': 'Bearer $t'},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _cachedUser = _parseUser(data);
      }
    } catch (_) {
      _cachedUser = null;
    }
  }

  AuthUser? _parseUser(dynamic data) => NeonAuthResponseParser.parseUser(data);

  String? _extractTokenFromBody(String body) =>
      NeonAuthResponseParser.extractToken(body);

  bool _isJwt(String s) =>
      s.length > 50 && s.startsWith('eyJ') && s.contains('.');

  void clearCacheForTesting() {
    _cachedToken = null;
    _cachedUser = null;
    notifyListeners();
  }
}

class AuthException implements Exception {
  AuthException(this.statusCode, this.message);
  final int statusCode;
  final String message;
  @override
  String toString() => 'AuthException($statusCode): $message';
}
