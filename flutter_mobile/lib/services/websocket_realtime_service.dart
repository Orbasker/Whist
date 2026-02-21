import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'realtime_types.dart';

/// WebSocket realtime client; same backend endpoint and message contract as Angular.
class WebSocketRealtimeService implements RealtimeService {
  WebSocketRealtimeService({required this.apiBaseUrl});

  /// API base URL (e.g. http://localhost:8000/api/v1). WS URL is derived from this.
  final String apiBaseUrl;

  WebSocketChannel? _channel;
  final StreamController<RealtimeMessage> _messageController =
      StreamController<RealtimeMessage>.broadcast();
  final StreamController<bool> _connectionStatusController =
      StreamController<bool>.broadcast();

  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 3);

  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  String? _currentGameId;
  String? _lastToken;
  StreamSubscription? _subscription;

  @override
  Stream<RealtimeMessage> connect(String gameId, {String? token}) {
    if (_channel != null &&
        _currentGameId == gameId &&
        _connectionStatusController.hasListener) {
      return _messageController.stream;
    }

    _disconnectQuietly();
    _currentGameId = gameId;
    _lastToken = token;
    _reconnectAttempts = 0;
    _connect(gameId, token);
    return _messageController.stream;
  }

  void _connect(String gameId, String? token) {
    final uri = _webSocketUri(gameId, token);
    try {
      _channel = WebSocketChannel.connect(uri);
      _connectionStatusController.add(true);
      _reconnectAttempts = 0;

      _subscription = _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
        cancelOnError: false,
      );
    } catch (e) {
      _connectionStatusController.add(false);
      _scheduleReconnect(gameId);
    }
  }

  Uri _webSocketUri(String gameId, String? token) {
    final base = apiBaseUrl.replaceAll('/api/v1', '').trim();
    final wsScheme = base.startsWith('https') ? 'wss' : 'ws';
    final host = base
        .replaceFirst(RegExp(r'^https?://'), '')
        .replaceAll(RegExp(r'/$'), '');
    var path = '$wsScheme://$host/api/v1/ws/games/$gameId';
    if (token != null && token.isNotEmpty) {
      path += '?token=${Uri.encodeComponent(token)}';
    }
    return Uri.parse(path);
  }

  void _onMessage(dynamic data) {
    try {
      final map = jsonDecode(data as String) as Map<String, dynamic>;
      _messageController.add(RealtimeMessage.fromJson(map));
    } catch (_) {
      // ignore parse errors
    }
  }

  void _onError(dynamic error) {
    _connectionStatusController.add(false);
  }

  void _onDone() {
    _connectionStatusController.add(false);
    if (_currentGameId != null) {
      _scheduleReconnect(_currentGameId!);
    }
  }

  void _scheduleReconnect(String gameId) {
    if (_reconnectAttempts >= _maxReconnectAttempts) return;
    _reconnectAttempts++;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _reconnectTimer = null;
      if (_currentGameId == gameId) {
        _connect(gameId, _lastToken);
      }
    });
  }

  void _disconnectQuietly() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close();
    _channel = null;
    _currentGameId = null;
    _connectionStatusController.add(false);
  }

  @override
  void disconnect() {
    _disconnectQuietly();
  }

  @override
  void send(Map<String, dynamic> message) {
    final ch = _channel;
    if (ch == null) {
      throw StateError('Realtime is not connected');
    }
    ch.sink.add(jsonEncode(message));
  }

  @override
  bool get isConnected => _channel != null;

  @override
  Stream<bool> get connectionStatus => _connectionStatusController.stream;
}
