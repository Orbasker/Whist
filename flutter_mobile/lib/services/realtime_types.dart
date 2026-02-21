/// Realtime message types aligned with backend WebSocket and Angular realtime.types.
/// Used for game_update, phase_update, bid_selection, trick_selection, etc.
library;

/// Message type string from backend.
typedef RealtimeMessageType = String;

/// Parsed realtime message (JSON from backend).
class RealtimeMessage {
  const RealtimeMessage({
    required this.type,
    this.game,
    this.phase,
    this.round,
    this.data,
    this.message,
  });

  final String type;
  final Map<String, dynamic>? game;
  final String? phase; // 'bidding' | 'tricks'
  final Map<String, dynamic>? round;
  final Map<String, dynamic>? data;
  final String? message;

  factory RealtimeMessage.fromJson(Map<String, dynamic> json) {
    return RealtimeMessage(
      type: json['type'] as String? ?? '',
      game: json['game'] as Map<String, dynamic>?,
      phase: json['phase'] as String?,
      round: json['round'] as Map<String, dynamic>?,
      data: json['data'] as Map<String, dynamic>?,
      message: json['message'] as String?,
    );
  }
}

/// Abstraction for real-time game updates (WebSocket or Supabase Realtime).
abstract class RealtimeService {
  /// Connect to the game room and return a stream of messages.
  /// [token] JWT for auth; required by backend.
  Stream<RealtimeMessage> connect(String gameId, {String? token});

  void disconnect();

  /// Send a command (e.g. submit_bids, submit_tricks, bid_selection).
  void send(Map<String, dynamic> message);

  bool get isConnected;

  /// Connection status: true when connected.
  Stream<bool> get connectionStatus;
}
