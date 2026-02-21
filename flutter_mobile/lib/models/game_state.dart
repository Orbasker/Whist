/// Game state from API; aligned with Angular GameState and backend GameResponse.
class GameState {
  final String id;
  final List<String> players;
  final List<int> scores;
  final int currentRound;
  final String status; // 'active' | 'completed'
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
