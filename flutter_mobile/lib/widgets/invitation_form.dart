import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../services/api_service.dart';

/// Invitation form content: send invites for a game (owner only).
/// Matches Angular invitation-form: available slots, email fields, send/cancel.
class InvitationForm extends StatefulWidget {
  const InvitationForm({
    super.key,
    required this.gameId,
    required this.gameName,
    required this.players,
    required this.playerUserIds,
    required this.api,
    required this.onSent,
    required this.onCancel,
  });

  final String gameId;
  final String gameName;
  final List<String> players;
  final List<String?>? playerUserIds;
  final ApiService api;
  final void Function({required int sent, required int total}) onSent;
  final VoidCallback onCancel;

  @override
  State<InvitationForm> createState() => _InvitationFormState();
}

class _InvitationFormState extends State<InvitationForm> {
  final List<TextEditingController> _emailControllers =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());

  bool _sending = false;
  String? _errorMessage;
  String? _successMessage;

  /// Slot indices (0–3) that have no linked user (available for invite).
  List<int> get _availableSlotIndices {
    final ids = widget.playerUserIds ?? [];
    final indices = <int>[];
    for (var i = 0; i < 4; i++) {
      final id = i < ids.length ? ids[i] : null;
      if (id == null || id.trim().isEmpty) {
        indices.add(i);
      }
    }
    return indices;
  }

  bool get _isGameFull => _availableSlotIndices.isEmpty;

  static final RegExp _emailRegex = RegExp(
    r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
  );

  static bool _isValidEmail(String s) {
    return s.trim().isNotEmpty && _emailRegex.hasMatch(s.trim());
  }

  @override
  void dispose() {
    for (final c in _emailControllers) c.dispose();
    for (final f in _focusNodes) f.dispose();
    super.dispose();
  }

  List<String> _getValidEmails() {
    final emails = <String>[];
    for (final slotIndex in _availableSlotIndices) {
      if (slotIndex < _emailControllers.length) {
        final email = _emailControllers[slotIndex].text.trim();
        if (_isValidEmail(email)) emails.add(email);
      }
    }
    return emails;
  }

  List<int> _getValidIndices() {
    final indices = <int>[];
    for (final slotIndex in _availableSlotIndices) {
      if (slotIndex < _emailControllers.length) {
        final email = _emailControllers[slotIndex].text.trim();
        if (_isValidEmail(email)) indices.add(slotIndex);
      }
    }
    return indices;
  }

  bool _hasValidEmails() => _getValidEmails().isNotEmpty;

  Future<void> _onSend() async {
    final emails = _getValidEmails();
    final indices = _getValidIndices();

    if (emails.isEmpty) {
      setState(() {
        _errorMessage = AppStrings.invitationFormAtLeastOneEmail;
      });
      return;
    }
    if (widget.gameId.isEmpty) {
      setState(() {
        _errorMessage = AppStrings.invitationFormGameIdMissing;
      });
      return;
    }

    setState(() {
      _sending = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final result = await widget.api.sendInvitationsByEmails(
        widget.gameId,
        emails,
        indices.isEmpty ? null : indices,
      );

      if (!mounted) return;
      if (result.sent > 0) {
        setState(() {
          _successMessage =
              AppStrings.invitationsSentSuccess(result.sent, result.total);
          _sending = false;
        });
        widget.onSent(sent: result.sent, total: result.total);
        for (final c in _emailControllers) c.clear();
        Future.delayed(const Duration(milliseconds: 2000), () {
          if (mounted) widget.onCancel();
        });
      } else {
        setState(() {
          _errorMessage = AppStrings.invitationsSendFailed;
          _sending = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().contains('ApiException')
            ? AppStrings.invitationsSendFailed
            : AppStrings.invitationFormSendError;
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isGameFull) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppStrings.invitationFormGameFull,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: widget.onCancel,
              child: const Text(AppStrings.close),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppStrings.invitationFormTitle,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              AppStrings.invitationFormEnterEmails,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (widget.players.isNotEmpty) ...[
              const SizedBox(height: 16),
              _PlayersInGame(players: widget.players),
            ],
            const SizedBox(height: 16),
            ..._availableSlotIndices.map((slotIndex) {
              final n = slotIndex + 1;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _emailControllers[slotIndex],
                      focusNode: _focusNodes[slotIndex],
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      decoration: InputDecoration(
                        labelText: AppStrings.invitationFormSlotPlaceholder(n),
                        errorText: _emailControllers[slotIndex].text.isNotEmpty &&
                                !_isValidEmail(
                                    _emailControllers[slotIndex].text)
                            ? AppStrings.invitationFormInvalidEmail
                            : null,
                        border: const OutlineInputBorder(),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                ),
              );
            }),
            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _errorMessage!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                ),
              ),
            ],
            if (_successMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _successMessage!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed:
                        _sending || !_hasValidEmails() ? null : _onSend,
                    child: _sending
                        ? const Text(AppStrings.invitationFormSending)
                        : const Text(
                            AppStrings.invitationFormSendInvitations,
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: _sending ? null : widget.onCancel,
                  child: const Text(AppStrings.cancel),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PlayersInGame extends StatelessWidget {
  const _PlayersInGame({required this.players});

  final List<String> players;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppStrings.invitationFormPlayersInGame,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          ...List.generate(
            players.length.clamp(0, 4),
            (i) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                AppStrings.invitationFormPlayerLabel(i + 1, players[i].isEmpty ? '—' : players[i]),
                style: theme.textTheme.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
