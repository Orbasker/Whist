import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/game_state.dart';
import '../models/round.dart';

/// API client aligned with Angular ApiService and backend routes.
class ApiService {
  ApiService({required this.baseUrl, this.authToken});

  final String baseUrl;
  final String? authToken;

  Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authToken != null && authToken!.isNotEmpty) {
      map['Authorization'] = 'Bearer $authToken';
    }
    return map;
  }

  Future<List<GameState>> listGames() async {
    final r = await http.get(
      Uri.parse('$baseUrl/games'),
      headers: _headers,
    );
    _checkResponse(r);
    final list = jsonDecode(r.body) as List;
    return list.map((e) => GameState.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<GameState> getGame(String gameId) async {
    final r = await http.get(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: _headers,
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<void> deleteGame(String gameId) async {
    final r = await http.delete(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: _headers,
    );
    _checkResponse(r);
  }

  Future<List<Round>> getRounds(String gameId) async {
    final r = await http.get(
      Uri.parse('$baseUrl/games/$gameId/rounds'),
      headers: _headers,
    );
    _checkResponse(r);
    final list = jsonDecode(r.body) as List;
    return list.map((e) => Round.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Submit bids for current round. Returns updated game.
  Future<GameState> submitBids(
    String gameId,
    List<int> bids, {
    String? trumpSuit,
  }) async {
    final body = <String, dynamic>{
      'bids': bids,
      if (trumpSuit != null && trumpSuit.isNotEmpty) 'trump_suit': trumpSuit,
    };
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/rounds/bids'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _checkResponse(r);
    final map = jsonDecode(r.body) as Map<String, dynamic>;
    final game = map['game'] as Map<String, dynamic>? ?? map;
    return GameState.fromJson(game);
  }

  /// Submit tricks for current round. Returns updated game and the created round.
  Future<SubmitTricksResult> submitTricks(
    String gameId,
    List<int> tricks,
    List<int> bids, {
    String? trumpSuit,
  }) async {
    final body = <String, dynamic>{
      'tricks': tricks,
      'bids': bids,
      if (trumpSuit != null && trumpSuit.isNotEmpty) 'trump_suit': trumpSuit,
    };
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/rounds/tricks'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _checkResponse(r);
    final map = jsonDecode(r.body) as Map<String, dynamic>;
    final gameMap = map['game'] as Map<String, dynamic>? ?? map;
    final roundMap = map['round'] as Map<String, dynamic>?;
    return SubmitTricksResult(
      game: GameState.fromJson(gameMap),
      round: roundMap != null ? Round.fromJson(roundMap) : null,
    );
  }

  void _checkResponse(http.Response r) {
    if (r.statusCode >= 400) {
      throw ApiException(r.statusCode, r.body);
    }
  }
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.body);
  final int statusCode;
  final String body;
  @override
  String toString() => 'ApiException($statusCode): $body';
}

/// Result of submitTricks: updated game and the round that was created.
class SubmitTricksResult {
  const SubmitTricksResult({required this.game, this.round});
  final GameState game;
  final Round? round;
}
