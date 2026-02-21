import '../models/game_state.dart';
import '../models/round.dart';
import 'api_service.dart';

/// Holds current game state and rounds; aligns with Angular GameService for score table / round history / delete.
class GameService {
  GameService(this._api);

  final ApiService _api;

  GameState? _gameState;
  List<Round> _rounds = [];
  String? _currentUserId;

  GameState? get gameState => _gameState;
  List<Round> get rounds => List.unmodifiable(_rounds);
  String? get currentUserId => _currentUserId;

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

  Future<List<GameState>> listGames() async {
    return _api.listGames();
  }

  Future<GameState> createGame(List<String> players, {String? name}) async {
    final game = await _api.createGame(players, name: name);
    _gameState = game;
    _rounds = await _api.getRounds(game.id);
    return game;
  }

  Future<GameState> loadGame(String gameId) async {
    final game = await _api.getGame(gameId);
    _gameState = game;
    _rounds = await _api.getRounds(gameId);
    return game;
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
  }
}
