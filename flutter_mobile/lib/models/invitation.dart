/// Invitation DTOs aligned with backend schemas (invitation.py).
library;

/// Request: create and send invitations for a game.
class InvitationCreate {
  InvitationCreate({required this.emails, this.playerIndices});

  final List<String> emails;
  final List<int>? playerIndices;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'emails': emails};
    if (playerIndices != null) {
      map['player_indices'] = playerIndices;
    }
    return map;
  }
}

/// Response: invitation info from token (public, no auth).
class InvitationInfo {
  InvitationInfo({
    required this.gameId,
    this.gameName,
    this.inviterName,
    required this.playerIndex,
    required this.expiresAt,
  });

  final String gameId;
  final String? gameName;
  final String? inviterName;
  final int playerIndex;
  final int expiresAt;

  factory InvitationInfo.fromJson(Map<String, dynamic> json) {
    return InvitationInfo(
      gameId: json['game_id'].toString(),
      gameName: json['game_name'] as String?,
      inviterName: json['inviter_name'] as String?,
      playerIndex: json['player_index'] as int,
      expiresAt: json['expires_at'] as int,
    );
  }
}

/// Response: send invitations result.
class InvitationResponse {
  InvitationResponse({required this.sent, required this.total, this.tokens});

  final int sent;
  final int total;
  final List<String>? tokens;

  factory InvitationResponse.fromJson(Map<String, dynamic> json) {
    return InvitationResponse(
      sent: json['sent'] as int,
      total: json['total'] as int,
      tokens: json['tokens'] == null
          ? null
          : List<String>.from(json['tokens'] as List),
    );
  }
}

/// Response: accept invitation result.
class InvitationAcceptResponse {
  InvitationAcceptResponse({
    required this.gameId,
    required this.joined,
    required this.playerIndex,
    required this.message,
  });

  final String gameId;
  final bool joined;
  final int playerIndex;
  final String message;

  factory InvitationAcceptResponse.fromJson(Map<String, dynamic> json) {
    return InvitationAcceptResponse(
      gameId: json['game_id'].toString(),
      joined: json['joined'] as bool,
      playerIndex: json['player_index'] as int,
      message: json['message'] as String,
    );
  }
}
