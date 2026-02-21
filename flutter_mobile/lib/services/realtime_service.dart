import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

/// WebSocket realtime service aligned with Angular WebSocketService and backend /ws/games/{id}.
/// Connect with game ID and optional JWT; receives game_update, phase_update, bid_selection, etc.
class RealtimeService {
  WebSocketChannel? _channel;
  String? _currentGameId;
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  bool get isConnected =>
      _channel != null &&
      _channel!.closeCode == null &&
      _channel!.closeReason == null;

  String? get currentGameId => _currentGameId;

  /// Build WebSocket URL from API base URL (e.g. http://localhost:8000/api/v1 -> ws://localhost:8000/api/v1/ws/games/{gameId}).
  static String getWebSocketUrl(String apiBaseUrl, String gameId, [String? token]) {
    final base = apiBaseUrl.replaceAll(RegExp(r'/api/v1$'), '');
    final wsScheme = base.startsWith('https') ? 'wss' : 'ws';
    final host = base.replaceFirst(RegExp(r'^https?://'), '');
    var path = '$wsScheme://$host/api/v1/ws/games/$gameId';
    if (token != null && token.isNotEmpty) {
      path = '$path?token=${Uri.encodeComponent(token)}';
    }
    return path;
  }

  void connect(String apiBaseUrl, String gameId, [String? token]) {
    if (isConnected && _currentGameId == gameId) return;
    disconnect();
    _currentGameId = gameId;
    final url = getWebSocketUrl(apiBaseUrl, gameId, token);
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
        cancelOnError: false,
      );
    } catch (e) {
      _currentGameId = null;
      _messageController.add({'type': 'error', 'message': e.toString()});
    }
  }

  void _onMessage(dynamic data) {
    try {
      final map = jsonDecode(data as String) as Map<String, dynamic>;
      _messageController.add(map);
    } catch (_) {
      _messageController.add({'type': 'error', 'message': 'Invalid JSON'});
    }
  }

  void _onError(dynamic error) {
    _messageController.add({'type': 'error', 'message': error?.toString() ?? 'WebSocket error'});
  }

  void _onDone() {
    _channel = null;
    _currentGameId = null;
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _currentGameId = null;
  }

  void send(Map<String, dynamic> message) {
    if (!isConnected || _channel == null) {
      throw StateError('WebSocket is not connected');
    }
    _channel!.sink.add(jsonEncode(message));
  }

  void dispose() {
    disconnect();
    _messageController.close();
  }
}
