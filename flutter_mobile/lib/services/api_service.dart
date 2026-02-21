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
      headers: _headers,
      body: jsonEncode(body),
    );
    _checkResponse(r);
    return InvitationResponse.fromJson(
      jsonDecode(r.body) as Map<String, dynamic>,
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
