/// Round from API; aligned with backend RoundResponse.
class Round {
  final int id;
  final String gameId;
  final int roundNumber;
  final List<int> bids;
  final List<int> tricks;
  final List<int> scores;
  final String roundMode;
  final String? trumpSuit;
  final String? createdBy;
  final DateTime createdAt;

  const Round({
    required this.id,
    required this.gameId,
    required this.roundNumber,
    required this.bids,
    required this.tricks,
    required this.scores,
    required this.roundMode,
    this.trumpSuit,
    this.createdBy,
    required this.createdAt,
  });

  factory Round.fromJson(Map<String, dynamic> json) {
    return Round(
      id: json['id'] as int,
      gameId: json['game_id'] as String,
      roundNumber: json['round_number'] as int,
      bids: List<int>.from(
          (json['bids'] as List).map((e) => e is int ? e : int.parse('$e'))),
      tricks: List<int>.from(
          (json['tricks'] as List).map((e) => e is int ? e : int.parse('$e'))),
      scores: List<int>.from(
          (json['scores'] as List).map((e) => e is int ? e : int.parse('$e'))),
      roundMode: json['round_mode'] as String? ?? 'over',
      trumpSuit: json['trump_suit'] as String?,
      createdBy: json['created_by']?.toString(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Request: submit bids (backend RoundCreate).
class RoundCreate {
  RoundCreate({required this.bids, this.trumpSuit});

  final List<int> bids;
  final String? trumpSuit;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'bids': bids};
    if (trumpSuit != null) map['trump_suit'] = trumpSuit;
    return map;
  }
}

/// Request: submit tricks (backend TricksSubmit).
class TricksSubmit {
  TricksSubmit({
    required this.tricks,
    required this.bids,
    this.trumpSuit,
  });

  final List<int> tricks;
  final List<int> bids;
  final String? trumpSuit;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'tricks': tricks,
      'bids': bids,
    };
    if (trumpSuit != null) map['trump_suit'] = trumpSuit;
    return map;
  }
}
