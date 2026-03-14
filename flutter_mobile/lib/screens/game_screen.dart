import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../l10n/app_strings.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/game_service.dart';
import '../theme/app_colors.dart';
import '../widgets/bidding_phase_content.dart';
import '../widgets/invitation_form.dart';
import '../widgets/round_history_screen.dart';
import '../widgets/score_table_sheet.dart';
import '../widgets/tricks_phase_content.dart';

/// Game screen: bidding phase (players, live bids, trump, submit) or tricks phase; score table and round history.
/// When [gameId] is provided (e.g. from Home), loads that game. Otherwise tries current game or first from list.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key, this.gameId});

  final String? gameId;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadGame();
    WidgetsBinding.instance.addPostFrameCallback((_) => _setCurrentUser());
  }

  void _setCurrentUser() {
    final auth = context.read<AuthService>();
    context.read<GameService>().setCurrentUserId(auth.user?.id);
  }

  Future<void> _loadGame() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final gameService = context.read<GameService>();
      String? id = widget.gameId;
      if (id == null && gameService.gameState != null) {
        id = gameService.gameState!.id;
      }
      if (id == null) {
        final games = await gameService.listGames();
        if (games.isNotEmpty) id = games.first.id;
      }
      if (id != null) await gameService.loadGame(id);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameService>(
      builder: (context, gameService, _) {
        final gameState = gameService.gameState;

        if (_loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final l10n = AppLocalizations.of(context)!;
        if (_error != null) {
          return Scaffold(
            appBar: AppBar(
              title: Text(l10n.appTitle),
              actions: [_buildLanguageMenu(context)],
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _error = null;
                          _loading = true;
                        });
                        _loadGame();
                      },
                      child: Text(l10n.retry),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (gameState == null) {
          return Scaffold(
            appBar: AppBar(
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(l10n.appTitle),
              actions: [_buildLanguageMenu(context)],
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(l10n.noGameLoaded, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Back to Home'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final phaseLabel = gameService.phase == GamePhase.tricks
            ? AppStrings.gameTricks
            : AppStrings.gameBidding;
        final roundsPlayed = gameState.currentRound - 1;

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title:
                Text('${l10n.appBarTitleRounds(roundsPlayed)} · $phaseLabel'),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(height: 1, color: AppColors.border),
            ),
            actions: [
              _RealtimeIndicator(isConnected: gameService.isRealtimeConnected),
              IconButton(
                icon: const Icon(Icons.history),
                tooltip: l10n.roundHistoryTooltip,
                onPressed: () => _openRoundHistory(context, gameService),
              ),
              IconButton(
                icon: const Icon(Icons.emoji_events_outlined),
                tooltip: l10n.scoreTableTooltip,
                onPressed: () => _openScoreTableSheet(context, gameService),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.account_circle_outlined),
                tooltip: 'Log out',
                onSelected: (value) {
                  if (value == 'logout') _logout(context);
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'logout', child: Text('Log out')),
                ],
              ),
              _buildLanguageMenu(context),
            ],
          ),
          body: gameService.phase == GamePhase.tricks
              ? TricksPhaseContent(
                  gameState: gameState,
                  onOpenScoreTable: () =>
                      _openScoreTableSheet(context, gameService),
                  onOpenRoundHistory: () =>
                      _openRoundHistory(context, gameService),
                  onRoundComplete: () => setState(() {}),
                )
              : BiddingPhaseContent(
                  gameState: gameState,
                  roundsPlayed: roundsPlayed,
                ),
        );
      },
    );
  }

  void _openScoreTableSheet(BuildContext context, GameService gameService) {
    final gameState = gameService.gameState!;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => ScoreTableSheet(
        gameState: gameState,
        isGameOwner: gameService.isGameOwner,
        onDismiss: () => Navigator.of(context).pop(),
        onInviteRequested: gameService.isGameOwner
            ? () {
                Navigator.of(context).pop(); // close score sheet first
                _openInviteModal(context, gameService);
              }
            : null,
        onDeleteRequested: () async {
          await gameService.deleteGame(gameState.id);
          if (!context.mounted) return;
          Navigator.of(context).pop(); // close sheet
          gameService.clearGame();
          if (!context.mounted) return;
          Navigator.of(context).pop(); // back to Home
        },
      ),
    );
  }

  void _openInviteModal(BuildContext context, GameService gameService) {
    final gameState = gameService.gameState!;
    final api = context.read<ApiService>();
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text(AppStrings.sendInvitations),
        content: SizedBox(
          width: double.maxFinite,
          child: InvitationForm(
            gameId: gameState.id,
            gameName: gameState.name?.isNotEmpty == true
                ? gameState.name!
                : (gameState.players.isNotEmpty
                    ? gameState.players.join(', ')
                    : 'Unnamed game'),
            players: gameState.players,
            playerUserIds: gameState.playerUserIds,
            api: api,
            onSent: ({required int sent, required int total}) async {
              if (sent > 0 && dialogContext.mounted) {
                await gameService.loadGame(gameState.id);
              }
            },
            onCancel: () => Navigator.of(dialogContext).pop(),
          ),
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    context.read<GameService>().clearGame();
    await context.read<AuthService>().signOut();
    // AuthGate rebuilds and shows AuthScreen; no setState needed.
  }

  void _openRoundHistory(BuildContext context, GameService gameService) {
    final gameState = gameService.gameState!;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => RoundHistoryScreen(
          rounds: gameService.rounds,
          players: gameState.players,
          currentPlayerIndex: gameService.currentPlayerIndex,
          onClose: () => Navigator.of(context).pop(),
        ),
      ),
    );
  }

  Widget _buildLanguageMenu(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeProvider = context.watch<LocaleProvider>();
    return PopupMenuButton<AppLocale>(
      tooltip: l10n.language,
      icon: const Icon(Icons.language),
      onSelected: (locale) => localeProvider.setLocale(locale),
      itemBuilder: (context) => [
        PopupMenuItem(
          value: AppLocale.he,
          child: Row(
            children: [
              if (localeProvider.appLocale == AppLocale.he)
                const Icon(Icons.check, size: 20),
              if (localeProvider.appLocale == AppLocale.he)
                const SizedBox(width: 8),
              Text(l10n.hebrew),
            ],
          ),
        ),
        PopupMenuItem(
          value: AppLocale.en,
          child: Row(
            children: [
              if (localeProvider.appLocale == AppLocale.en)
                const Icon(Icons.check, size: 20),
              if (localeProvider.appLocale == AppLocale.en)
                const SizedBox(width: 8),
              Text(l10n.english),
            ],
          ),
        ),
      ],
    );
  }
}

class _RealtimeIndicator extends StatelessWidget {
  const _RealtimeIndicator({required this.isConnected});

  final bool isConnected;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Tooltip(
          message:
              isConnected ? 'Live updates connected' : 'Realtime disconnected',
          child: Icon(
            isConnected ? Icons.circle : Icons.circle_outlined,
            size: 10,
            color: isConnected
                ? AppColors.success
                : Theme.of(context).colorScheme.outline,
          ),
        ),
      ),
    );
  }
}
