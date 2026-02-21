import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/game_state.dart';
import '../models/round.dart';
import 'api_service.dart';
import 'realtime_types.dart';

/// Holds current game state and rounds; aligns with Angular GameService for score table / round history / delete.
/// When [RealtimeService] is set, connects to the same backend WebSocket for game_update, phase_update,
/// bid_selection, trick_selection, etc., and can send submit_bids, submit_tricks, bid_selection, etc.
class GameService extends ChangeNotifier {
  GameService(this._api, [RealtimeService? realtime]) : _realtime = realtime;

  final ApiService _api;
  final RealtimeService? _realtime;

  GameState? _gameState;
  List<Round> _rounds = [];
  String? _currentUserId;
  String? _authToken;
  StreamSubscription<RealtimeMessage>? _realtimeSubscription;
  String? _currentPhase; // 'bidding' | 'tricks'
  final Map<int, int> _liveBidSelections = {};
  final Map<int, int> _liveTrickSelections = {};
  String? _liveTrumpSelection;
  String? _realtimeError;

  GameState? get gameState => _gameState;
  List<Round> get rounds => List.unmodifiable(_rounds);
  String? get currentUserId => _currentUserId;
  String? get currentPhase => _currentPhase;
  Map<int, int> get liveBidSelections => Map.unmodifiable(_liveBidSelections);
  Map<int, int> get liveTrickSelections =>
      Map.unmodifiable(_liveTrickSelections);
  String? get liveTrumpSelection => _liveTrumpSelection;
  String? get realtimeError => _realtimeError;
  bool get isRealtimeConnected => _realtime?.isConnected ?? false;
  Stream<bool> get realtimeConnectionStatus =>
      _realtime?.connectionStatus ?? const Stream.empty();

  void setCurrentUserId(String? id) {
    _currentUserId = id;
    notifyListeners();
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  bool get isGameOwner {
    final g = _gameState;
    if (g?.ownerId == null) return false;
    final o = _normalize(g!.ownerId);
    if (_currentUserId != null && o == _normalize(_currentUserId)) return true;
    return false;
  }

  int? get currentPlayerIndex {
    final g = _gameState;
    if (g?.playerUserIds == null || _currentUserId == null) return null;
    final u = _normalize(_currentUserId!);
    for (var i = 0; i < g!.playerUserIds!.length; i++) {
      final pid = g.playerUserIds![i];
      if (pid != null && _normalize(pid) == u) return i;
    }
    return null;
  }

  static String _normalize(String? s) {
    if (s == null || s.isEmpty) return '';
    return s.trim().toLowerCase().replaceAll('-', '');
  }

  void _clearRoundState() {
    _liveBidSelections.clear();
    _liveTrickSelections.clear();
    _liveTrumpSelection = null;
    _realtimeError = null;
  }

  Future<GameState> loadGame(String gameId) async {
    final game = await _api.getGame(gameId);
    _gameState = game;
    _rounds = await _api.getRounds(gameId);
    _realtimeError = null;

    if (_realtime != null) {
      _realtimeSubscription?.cancel();
      _realtime!.disconnect();
      _realtimeSubscription = _realtime!
          .connect(gameId, token: _authToken)
          .listen(_onRealtimeMessage);
    }

    notifyListeners();
    return game;
  }

  void _onRealtimeMessage(RealtimeMessage msg) {
    switch (msg.type) {
      case 'game_update':
        if (msg.game != null) {
          _gameState = GameState.fromJson(msg.game!);
          _realtimeError = null;
          notifyListeners();
        }
        break;
      case 'phase_update':
        if (msg.phase != null) {
          _currentPhase = msg.phase;
          notifyListeners();
        }
        break;
      case 'bid_selection':
        final d = msg.data;
        if (d != null) {
          final idx = _intKey(d['player_index']);
          final bid = d['bid'] as int?;
          if (idx != null && bid != null) {
            _liveBidSelections[idx] = bid;
            notifyListeners();
          }
        }
        break;
      case 'trick_selection':
        final d = msg.data;
        if (d != null) {
          final idx = _intKey(d['player_index']);
          final trick = d['trick'] as int?;
          if (idx != null && trick != null) {
            _liveTrickSelections[idx] = trick;
            notifyListeners();
          }
        }
        break;
      case 'trump_selection':
        _liveTrumpSelection = msg.data?['trump_suit'] as String?;
        notifyListeners();
        break;
      case 'bet_change':
        final d = msg.data;
        if (d != null) {
          final idx = _intKey(d['player_index']);
          final bid = d['bid'] as int?;
          if (idx != null && bid != null) {
            _liveBidSelections[idx] = bid;
            notifyListeners();
          }
        }
        break;
      case 'bet_locked':
      case 'round_score_locked':
        // Can be used by UI to show locked state; we don't track locked set here
        break;
      case 'round_result_changed':
        final d = msg.data;
        if (d != null) {
          final idx = _intKey(d['player_index']);
          final trick = d['trick'] as int?;
          if (idx != null && trick != null) {
            _liveTrickSelections[idx] = trick;
            notifyListeners();
          }
        }
        break;
      case 'bids_submitted':
        if (msg.game != null) {
          _gameState = GameState.fromJson(msg.game!);
          _currentPhase = 'tricks';
          _clearRoundState();
          notifyListeners();
        }
        break;
      case 'tricks_submitted':
        if (msg.game != null) {
          _gameState = GameState.fromJson(msg.game!);
          _currentPhase = 'bidding';
          _clearRoundState();
          _loadRoundsIfCurrentGame(_gameState!.id);
          notifyListeners();
        }
        break;
      case 'error':
        _realtimeError = msg.message ?? 'Realtime error';
        notifyListeners();
        break;
      default:
        break;
    }
  }

  int? _intKey(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    final n = int.tryParse(v.toString());
    return n;
  }

  Future<void> _loadRoundsIfCurrentGame(String gameId) async {
    if (_gameState?.id != gameId) return;
    try {
      final list = await _api.getRounds(gameId);
      if (_gameState?.id == gameId) {
        _rounds = list;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<List<Round>> loadRounds(String gameId) async {
    final list = await _api.getRounds(gameId);
    if (_gameState?.id == gameId) _rounds = list;
    notifyListeners();
    return list;
  }

  Future<void> deleteGame(String gameId) async {
    await _api.deleteGame(gameId);
    if (_gameState?.id == gameId) {
      _disconnectRealtime();
      _gameState = null;
      _rounds = [];
      _clearRoundState();
      _currentPhase = null;
      notifyListeners();
    }
  }

  void _disconnectRealtime() {
    _realtimeSubscription?.cancel();
    _realtimeSubscription = null;
    _realtime?.disconnect();
  }

  void clearGame() {
    _disconnectRealtime();
    _gameState = null;
    _rounds = [];
    _clearRoundState();
    _currentPhase = null;
    _realtimeError = null;
    notifyListeners();
  }

  // --- Send over realtime (same contract as Angular) ---

  void sendSubmitBids(List<int> bids, {String? trumpSuit}) {
    _requireRealtime();
    _realtime!.send({
      'type': 'submit_bids',
      'data': {'bids': bids, 'trump_suit': trumpSuit},
    });
  }

  void sendSubmitTricks(
    List<int> tricks, {
    required List<int> bids,
    String? trumpSuit,
  }) {
    _requireRealtime();
    _realtime!.send({
      'type': 'submit_tricks',
      'data': {'tricks': tricks, 'bids': bids, 'trump_suit': trumpSuit},
    });
  }

  void sendBidSelection(int playerIndex, int bid) {
    _requireRealtime();
    _realtime!.send({
      'type': 'bid_selection',
      'data': {'player_index': playerIndex, 'bid': bid},
    });
  }

  void sendTrickSelection(int playerIndex, int trick) {
    _requireRealtime();
    _realtime!.send({
      'type': 'trick_selection',
      'data': {'player_index': playerIndex, 'trick': trick},
    });
  }

  void sendTrumpSelection(String trumpSuit) {
    _requireRealtime();
    _realtime!.send({
      'type': 'trump_selection',
      'data': {'trump_suit': trumpSuit},
    });
  }

  void sendBetChange(int playerIndex, int bid) {
    _requireRealtime();
    _realtime!.send({
      'type': 'bet_change',
      'data': {'player_index': playerIndex, 'bid': bid},
    });
  }

  void sendBetLocked(int playerIndex) {
    _requireRealtime();
    _realtime!.send({
      'type': 'bet_locked',
      'data': {'player_index': playerIndex},
    });
  }

  void sendRoundResultChanged(int playerIndex, int trick) {
    _requireRealtime();
    _realtime!.send({
      'type': 'round_result_changed',
      'data': {'player_index': playerIndex, 'trick': trick},
    });
  }

  void sendRoundScoreLocked(int playerIndex) {
    _requireRealtime();
    _realtime!.send({
      'type': 'round_score_locked',
      'data': {'player_index': playerIndex},
    });
  }

  void _requireRealtime() {
    if (_realtime == null || !_realtime!.isConnected) {
      throw StateError('Realtime is not connected');
    }
  }
}
