/// Game state from API; aligned with backend GameResponse.
class GameState {
  final String id;
  final List<String> players;
  final List<int> scores;
  final int currentRound;
  final String status; // 'active' | 'completed' | 'shared'
  final String? gameMode; // 'scoring_only' | 'full_remote' | 'hybrid'
  final String? ownerId;
  final String? name;
  final List<String?>? playerUserIds;
  final bool isShared;
  final String? shareCode;
  final DateTime? resetRequestedAt;
  final List<String>? resetVoteUserIds;
  final DateTime createdAt;
  final DateTime updatedAt;

  const GameState({
    required this.id,
    required this.players,
    required this.scores,
    required this.currentRound,
    required this.status,
    this.gameMode,
    this.ownerId,
    this.name,
    this.playerUserIds,
    this.isShared = false,
    this.shareCode,
    this.resetRequestedAt,
    this.resetVoteUserIds,
    required this.createdAt,
    required this.updatedAt,
  });

  factory GameState.fromJson(Map<String, dynamic> json) {
    return GameState(
      id: json['id'].toString(),
      players: List<String>.from(json['players'] as List),
      scores: List<int>.from((json['scores'] as List).map((e) => e is int ? e : int.parse('$e'))),
      currentRound: json['current_round'] as int,
      status: json['status'] as String,
      gameMode: json['game_mode'] as String?,
      ownerId: json['owner_id'] as String?,
      name: json['name'] as String?,
      playerUserIds: json['player_user_ids'] == null
          ? null
          : (json['player_user_ids'] as List).map((e) => e?.toString()).toList(),
      isShared: json['is_shared'] as bool? ?? false,
      shareCode: json['share_code'] as String?,
      resetRequestedAt: json['reset_requested_at'] == null
          ? null
          : DateTime.tryParse(json['reset_requested_at'] as String),
      resetVoteUserIds: json['reset_vote_user_ids'] == null
          ? null
          : List<String>.from(json['reset_vote_user_ids'] as List),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

/// Request: create game (backend GameCreate).
class GameCreate {
  GameCreate({required this.players, this.name});

  final List<String> players;
  final String? name;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'players': players};
    if (name != null) map['name'] = name;
    return map;
  }
}

/// Request: update game (backend GameUpdate).
class GameUpdate {
  GameUpdate({this.scores, this.currentRound, this.status, this.name});

  final List<int>? scores;
  final int? currentRound;
  final String? status;
  final String? name;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (scores != null) map['scores'] = scores;
    if (currentRound != null) map['current_round'] = currentRound;
    if (status != null) map['status'] = status;
    if (name != null) map['name'] = name;
    return map;
  }
}

/// Request: update player display name (backend PlayerDisplayNameUpdate).
class PlayerDisplayNameUpdate {
  PlayerDisplayNameUpdate({required this.displayName});

  final String displayName;

  Map<String, dynamic> toJson() => {'display_name': displayName};
}
