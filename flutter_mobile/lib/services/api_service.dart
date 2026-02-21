import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/game_state.dart';
import '../models/round.dart';

/// API client aligned with Angular ApiService and backend routes.
/// Use [getToken] to supply Bearer token from AuthService (Neon Auth).
class ApiService {
  ApiService({
    required this.baseUrl,
    this.authToken,
    this.getToken,
  }) : assert(authToken == null || getToken == null, 'Use either authToken or getToken');

  final String baseUrl;
  final String? authToken;
  /// When set, used for each request to attach Bearer token (overrides [authToken]).
  final Future<String?> Function()? getToken;

  Future<Map<String, String>> get _headers async {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    String? token = authToken;
    if (getToken != null) token = await getToken!();
    if (token != null && token.isNotEmpty) {
      map['Authorization'] = 'Bearer $token';
    }
    return map;
  }

  Future<List<GameState>> listGames() async {
    final r = await http.get(
      Uri.parse('$baseUrl/games'),
      headers: await _headers,
    );
    _checkResponse(r);
    final list = jsonDecode(r.body) as List;
    return list.map((e) => GameState.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<GameState> createGame(List<String> players, {String? name}) async {
    final body = <String, dynamic>{'players': players};
    if (name != null && name.trim().isNotEmpty) body['name'] = name.trim();
    final r = await http.post(
      Uri.parse('$baseUrl/games'),
      headers: await _headers,
      body: jsonEncode(body),
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> getGame(String gameId) async {
    final r = await http.get(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: await _headers,
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<void> deleteGame(String gameId) async {
    final r = await http.delete(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: await _headers,
    );
    _checkResponse(r);
  }

  Future<List<Round>> getRounds(String gameId) async {
    final r = await http.get(
      Uri.parse('$baseUrl/games/$gameId/rounds'),
      headers: await _headers,
    );
    _checkResponse(r);
    final list = jsonDecode(r.body) as List;
    return list.map((e) => Round.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Send invitations for a game. Requires auth; only game owner can invite.
  /// [playerIndices] optional slot indices (0-3) for each email; if null, assigned sequentially.
  Future<InvitationResponse> sendInvitations(
    String gameId,
    List<String> emails, [
    List<int>? playerIndices,
  ]) async {
    final body = <String, dynamic>{'emails': emails};
    if (playerIndices != null) body['player_indices'] = playerIndices;
    final r = await http.post(
      Uri.parse('$baseUrl/invite/games/$gameId/invite'),
      headers: await _headers,
      body: jsonEncode(body),
    );
    _checkResponse(r);
    return InvitationResponse.fromJson(
      jsonDecode(r.body) as Map<String, dynamic>,
    );
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
      headers: await _headers,
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
      headers: await _headers,
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

/// Response from POST /invite/games/:gameId/invite
class InvitationResponse {
  const InvitationResponse({required this.sent, required this.total});
  final int sent;
  final int total;
  factory InvitationResponse.fromJson(Map<String, dynamic> json) {
    return InvitationResponse(
      sent: json['sent'] as int,
      total: json['total'] as int,
    );
  }
}

/// Result of submitTricks: updated game and the round that was created.
class SubmitTricksResult {
  const SubmitTricksResult({required this.game, this.round});
  final GameState game;
  final Round? round;
}
