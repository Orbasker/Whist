import '../models/game_state.dart';
import '../models/round.dart';
import 'api_service.dart';

/// Current game phase: bidding or tricks (matches Angular/backend).
enum GamePhase {
  bidding,
  tricks,
}

/// Holds current game state and rounds; aligns with Angular GameService for score table / round history / delete.
class GameService {
  GameService(this._api);

  final ApiService _api;

  GameState? _gameState;
  List<Round> _rounds = [];
  String? _currentUserId;
  GamePhase _phase = GamePhase.bidding;
  List<int>? _currentBids;
  String? _currentTrumpSuit;

  GameState? get gameState => _gameState;
  List<Round> get rounds => List.unmodifiable(_rounds);
  String? get currentUserId => _currentUserId;
  GamePhase get phase => _phase;
  List<int>? get currentBids => _currentBids;
  String? get currentTrumpSuit => _currentTrumpSuit;

  void setCurrentUserId(String? id) {
    _currentUserId = id;
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

  Future<GameState> loadGame(String gameId) async {
    final game = await _api.getGame(gameId);
    _gameState = game;
    _rounds = await _api.getRounds(gameId);
    // Phase is not persisted on backend; keep local phase or default to bidding.
    return game;
  }

  /// Submit bids for current round; switches to tricks phase and stores bids/trump.
  Future<GameState> submitBids(
    String gameId,
    List<int> bids, {
    String? trumpSuit,
  }) async {
    final game = await _api.submitBids(gameId, bids, trumpSuit: trumpSuit);
    if (_gameState?.id == gameId) {
      _gameState = game;
      _phase = GamePhase.tricks;
      _currentBids = List<int>.from(bids);
      _currentTrumpSuit = trumpSuit;
    }
    return game;
  }

  /// Submit tricks for current round. Uses stored currentBids/currentTrumpSuit.
  /// Returns the created round for showing round summary; updates game state and rounds.
  Future<Round?> submitTricks(String gameId, List<int> tricks) async {
    final bids = _currentBids;
    if (bids == null || bids.length != 4) {
      throw StateError('No bids for this round. Submit bids first.');
    }
    final result = await _api.submitTricks(
      gameId,
      tricks,
      bids,
      trumpSuit: _currentTrumpSuit,
    );
    if (_gameState?.id != gameId) return result.round;
    _gameState = result.game;
    _phase = GamePhase.bidding;
    _currentBids = null;
    _currentTrumpSuit = null;
    _rounds = await _api.getRounds(gameId);
    return result.round;
  }

  Future<List<Round>> loadRounds(String gameId) async {
    final list = await _api.getRounds(gameId);
    if (_gameState?.id == gameId) _rounds = list;
    return list;
  }

  Future<void> deleteGame(String gameId) async {
    await _api.deleteGame(gameId);
    if (_gameState?.id == gameId) {
      _gameState = null;
      _rounds = [];
    }
  }

  void clearGame() {
    _gameState = null;
    _rounds = [];
    _phase = GamePhase.bidding;
    _currentBids = null;
    _currentTrumpSuit = null;
  }
}
