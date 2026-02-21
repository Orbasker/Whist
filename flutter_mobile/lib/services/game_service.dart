import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/game_state.dart';
import '../models/round.dart';
import 'api_service.dart';
import 'realtime_service.dart';

/// Holds current game state and rounds; aligns with Angular GameService for score table / round history / delete.
/// Supports realtime bidding: live bid/trump selections, locked bids, phase, submit bids.
class GameService extends ChangeNotifier {
  GameService(this._api);

  final ApiService _api;
  final RealtimeService _realtime = RealtimeService();
  StreamSubscription<Map<String, dynamic>>? _realtimeSubscription;

  GameState? _gameState;
  List<Round> _rounds = [];
  String? _currentUserId;
  String? _authToken;

  /// Current phase from realtime (phase_update / bids_submitted / tricks_submitted).
  String _phase = 'bidding';

  /// Live bid selections from realtime (bid_selection / bet_change).
  final Map<int, int> _liveBidSelections = {};

  /// Live trump selection from realtime (trump_selection).
  String? _liveTrumpSelection;

  /// Locked bid indices from realtime (bet_locked).
  final Set<int> _lockedBids = {};

  GameState? get gameState => _gameState;
  List<Round> get rounds => List.unmodifiable(_rounds);
  String? get currentUserId => _currentUserId;
  String get phase => _phase;
  Map<int, int> get liveBidSelections => Map.unmodifiable(_liveBidSelections);
  String? get liveTrumpSelection => _liveTrumpSelection;
  Set<int> get lockedBids => Set.unmodifiable(_lockedBids);

  bool get isRealtimeConnected => _realtime.isConnected;

  void setCurrentUserId(String? id) {
    _currentUserId = id;
    notifyListeners();
  }

  void setAuthToken(String? token) {
    _authToken = token;
    notifyListeners();
  }

  bool get isGameOwner {
    final g = _gameState;
    if (g?.ownerId == null) return false;
    final o = _normalize(g!.ownerId!);
    if (_currentUserId != null && o == _normalize(_currentUserId!)) return true;
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
    _liveTrumpSelection = null;
    _lockedBids.clear();
    notifyListeners();
  }

  void _handleRealtimeMessage(Map<String, dynamic> message) {
    final type = message['type'] as String?;
    if (type == null) return;
    switch (type) {
      case 'game_update':
        final game = message['game'];
        if (game is Map<String, dynamic>) {
          _gameState = GameState.fromJson(game);
          notifyListeners();
        }
        break;
      case 'phase_update':
        final p = message['phase'];
        if (p is String) {
          _phase = p;
          notifyListeners();
        }
        break;
      case 'bid_selection':
      case 'bet_change':
        final data = message['data'];
        if (data is Map<String, dynamic>) {
          final playerIndex = _parsePlayerIndex(data['player_index']);
          final bid = data['bid'];
          if (playerIndex != null && bid != null) {
            _liveBidSelections[playerIndex] = bid is int ? bid : int.tryParse('$bid') ?? 0;
            notifyListeners();
          }
        }
        break;
      case 'bet_locked':
        final data = message['data'];
        if (data is Map<String, dynamic>) {
          final playerIndex = _parsePlayerIndex(data['player_index']);
          if (playerIndex != null) {
            _lockedBids.add(playerIndex);
            notifyListeners();
          }
        }
        break;
      case 'trump_selection':
        final data = message['data'];
        if (data is Map<String, dynamic>) {
          final suit = data['trump_suit'];
          _liveTrumpSelection = suit is String ? suit : suit?.toString();
          notifyListeners();
        }
        break;
      case 'bids_submitted':
        final game = message['game'];
        if (game is Map<String, dynamic>) {
          _gameState = GameState.fromJson(game);
        }
        _phase = 'tricks';
        _clearRoundState();
        notifyListeners();
        break;
      case 'tricks_submitted':
        final game = message['game'];
        if (game is Map<String, dynamic>) {
          _gameState = GameState.fromJson(game);
        }
        _phase = 'bidding';
        _clearRoundState();
        notifyListeners();
        break;
      case 'error':
        // Could expose to UI; for now just notify so listeners can react
        notifyListeners();
        break;
    }
  }

  int? _parsePlayerIndex(dynamic v) {
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    return null;
  }

  Future<GameState> loadGame(String gameId) async {
    final game = await _api.getGame(gameId);
    _gameState = game;
    _rounds = await _api.getRounds(gameId);
    _phase = 'bidding';
    _clearRoundState();
    await _realtimeSubscription?.cancel();
    if (_authToken != null && _authToken!.isNotEmpty) {
      _realtime.connect(_api.baseUrl, gameId, _authToken);
      _realtimeSubscription = _realtime.messages.listen(_handleRealtimeMessage);
    }
    notifyListeners();
    return game;
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
      _realtimeSubscription?.cancel();
      _realtime.disconnect();
      _gameState = null;
      _rounds = [];
      _clearRoundState();
      _phase = 'bidding';
      notifyListeners();
    }
  }

  void clearGame() {
    _realtimeSubscription?.cancel();
    _realtime.disconnect();
    _gameState = null;
    _rounds = [];
    _phase = 'bidding';
    _clearRoundState();
    notifyListeners();
  }

  bool isBidLocked(int playerIndex) => _lockedBids.contains(playerIndex);

  bool isPlayerOwner(int playerIndex) {
    final g = _gameState;
    if (g?.ownerId == null ||
        g?.playerUserIds == null ||
        playerIndex < 0 ||
        playerIndex >= g!.playerUserIds!.length) {
      return false;
    }
    final playerUserId = g.playerUserIds![playerIndex];
    if (playerUserId == null) return false;
    return _normalize(playerUserId) == _normalize(g.ownerId);
  }

  void sendBidSelection(int playerIndex, int bid) {
    if (!_realtime.isConnected) return;
    if (currentPlayerIndex == null && !isGameOwner) return;
    if (isBidLocked(playerIndex)) return;
    final canSend = isGameOwner ||
        (currentPlayerIndex != null && playerIndex == currentPlayerIndex);
    if (!canSend) return;
    try {
      _realtime.send({
        'type': 'bid_selection',
        'data': {'player_index': playerIndex, 'bid': bid},
      });
      _realtime.send({
        'type': 'bet_change',
        'data': {'player_index': playerIndex, 'bid': bid},
      });
    } catch (_) {}
  }

  void sendTrumpSelection(String? trumpSuit) {
    if (!_realtime.isConnected || currentPlayerIndex == null) return;
    try {
      _realtime.send({
        'type': 'trump_selection',
        'data': {'trump_suit': trumpSuit},
      });
    } catch (_) {}
  }

  Future<void> lockBid(int playerIndex) async {
    if (!_realtime.isConnected) return;
    if (isBidLocked(playerIndex)) return;
    final isOwnBid = playerIndex == currentPlayerIndex;
    if ((isOwnBid && currentPlayerIndex != null) || isGameOwner) {
      try {
        _realtime.send({
          'type': 'bet_locked',
          'data': {'player_index': playerIndex},
        });
      } catch (_) {}
    }
  }

  Future<void> submitBids(List<int> bids, [String? trumpSuit]) async {
    final g = _gameState;
    if (g == null) throw StateError('No game loaded');
    if (!_realtime.isConnected) throw StateError('WebSocket is not connected');
    _realtime.send({
      'type': 'submit_bids',
      'data': {
        'bids': bids,
        'trump_suit': trumpSuit,
      },
    });
  }
}
