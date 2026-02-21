import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/game_state.dart';
import '../models/invitation.dart';
import '../models/round.dart';

/// HTTP client for Whist backend (games, rounds, invitations).
/// Uses same API base URL and auth as configured in the app.
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

  // —— Games ——

  Future<List<GameState>> listGames() async {
    final r = await http.get(
      Uri.parse('$baseUrl/games'),
      headers: _headers,
    );
    _checkResponse(r);
    final list = jsonDecode(r.body) as List;
    return list.map((e) => GameState.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<GameState> createGame(GameCreate body) async {
    final r = await http.post(
      Uri.parse('$baseUrl/games'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> getGame(String gameId) async {
    final r = await http.get(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: _headers,
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> updateGame(String gameId, GameUpdate body) async {
    final r = await http.put(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
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

  Future<GameState> updatePlayerDisplayName(
    String gameId,
    int playerIndex,
    PlayerDisplayNameUpdate body,
  ) async {
    final r = await http.patch(
      Uri.parse('$baseUrl/games/$gameId/players/$playerIndex'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> requestReset(String gameId) async {
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/reset-request'),
      headers: _headers,
      body: '{}',
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> voteReset(String gameId) async {
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/reset-vote'),
      headers: _headers,
      body: '{}',
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<GameState> cancelResetRequest(String gameId) async {
    final r = await http.delete(
      Uri.parse('$baseUrl/games/$gameId/reset-request'),
      headers: _headers,
    );
    _checkResponse(r);
    return GameState.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  // —— Rounds ——

  /// Submit bids for current round. Returns { game, round_mode, total_bids }.
  Future<Map<String, dynamic>> submitBids(String gameId, RoundCreate body) async {
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/rounds/bids'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
    );
    _checkResponse(r);
    final map = jsonDecode(r.body) as Map<String, dynamic>;
    if (map['game'] != null) {
      map['game'] = GameState.fromJson(map['game'] as Map<String, dynamic>);
    }
    return map;
  }

  /// Submit tricks and create round. Returns { game, round }.
  Future<Map<String, dynamic>> submitTricks(String gameId, TricksSubmit body) async {
    final r = await http.post(
      Uri.parse('$baseUrl/games/$gameId/rounds/tricks'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
    );
    _checkResponse(r);
    final map = jsonDecode(r.body) as Map<String, dynamic>;
    if (map['game'] != null) {
      map['game'] = GameState.fromJson(map['game'] as Map<String, dynamic>);
    }
    if (map['round'] != null) {
      map['round'] = Round.fromJson(map['round'] as Map<String, dynamic>);
    }
    return map;
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

  // —— Invitations ——

  Future<InvitationResponse> sendInvitations(
    String gameId,
    InvitationCreate body,
  ) async {
    final r = await http.post(
      Uri.parse('$baseUrl/invite/games/$gameId/invite'),
      headers: _headers,
      body: jsonEncode(body.toJson()),
    );
    _checkResponse(r);
    return InvitationResponse.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  /// Get invitation info from token (public, no auth required).
  Future<InvitationInfo> getInvitationInfo(String token) async {
    final r = await http.get(
      Uri.parse('$baseUrl/invite/$token'),
      headers: _headers,
    );
    _checkResponse(r);
    return InvitationInfo.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<InvitationAcceptResponse> acceptInvitation(String token) async {
    final r = await http.post(
      Uri.parse('$baseUrl/invite/$token/accept'),
      headers: _headers,
      body: '{}',
    );
    _checkResponse(r);
    return InvitationAcceptResponse.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
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
