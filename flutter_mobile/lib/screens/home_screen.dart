import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_strings.dart';
import '../models/game_state.dart';
import '../services/auth_service.dart';
import '../services/game_service.dart';
import 'game_screen.dart';

/// Home screen: user info, My games list (from API), New game action.
/// Create game flow: player names + optional game name, start game.
/// Aligned with Angular home behaviour.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<GameState> _games = [];
  bool _loading = true;
  String? _error;
  bool _showNewGameForm = false;

  @override
  void initState() {
    super.initState();
    _loadGames();
  }

  Future<void> _loadGames() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final gameService = context.read<GameService>();
      final list = await gameService.listGames();
      if (mounted) setState(() => _games = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openGame(String gameId) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => GameScreen(gameId: gameId),
      ),
    );
  }

  void _openNewGameForm() {
    setState(() => _showNewGameForm = true);
  }

  void _closeNewGameForm() {
    setState(() => _showNewGameForm = false);
  }

  static String _getGameDisplayName(GameState game) {
    if (game.name != null && game.name!.trim().isNotEmpty) return game.name!;
    if (game.players.isNotEmpty) return game.players.join(', ');
    return AppStrings.gameNameDefault;
  }

  static String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                    child: Column(
                      children: [
                        const SizedBox(height: 8),
                        Icon(
                          Icons.emoji_events_outlined,
                          size: 48,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          AppStrings.homeTitle,
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppStrings.homeSubtitle,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                        ),
                        const SizedBox(height: 16),
                        Consumer<AuthService>(
                          builder: (context, auth, _) {
                            final user = auth.user;
                            return Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  user?.name ?? user?.email ?? '',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: () async {
                                    await auth.signOut();
                                  },
                                  icon: const Icon(Icons.logout, size: 16),
                                  label: const Text(AppStrings.logOut),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  AppStrings.myGames,
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                FilledButton.icon(
                                  onPressed: _openNewGameForm,
                                  icon: const Icon(Icons.add, size: 20),
                                  label: const Text(AppStrings.newGame),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (_loading)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 24),
                                child:
                                    Center(child: CircularProgressIndicator()),
                              )
                            else if (_error != null)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 16),
                                child: Column(
                                  children: [
                                    Text(
                                      _error!,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color:
                                            Theme.of(context).colorScheme.error,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    OutlinedButton(
                                      onPressed: _loadGames,
                                      child: const Text(AppStrings.retry),
                                    ),
                                  ],
                                ),
                              )
                            else if (_games.isEmpty)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 24),
                                child: Column(
                                  children: [
                                    Text(
                                      AppStrings.noGames,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onSurfaceVariant,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      AppStrings.createGameToStart,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onSurfaceVariant,
                                          ),
                                    ),
                                  ],
                                ),
                              )
                            else
                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _games.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 8),
                                itemBuilder: (context, index) {
                                  final game = _games[index];
                                  return _GameListTile(
                                    game: game,
                                    displayName: _getGameDisplayName(game),
                                    formattedDate: _formatDate(game.updatedAt),
                                    onTap: () => _openGame(game.id),
                                  );
                                },
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ), // SafeArea (first child of Stack)
          if (_showNewGameForm)
            _NewGameModal(
              onClose: _closeNewGameForm,
              onCreate: (game) async {
                _closeNewGameForm();
                await _loadGames();
                _openGame(game.id);
              },
            ),
        ],
      ),
    );
  }
}

/// Full-screen overlay for new game form (aligns with Angular modal).
class _NewGameModal extends StatefulWidget {
  const _NewGameModal({
    required this.onClose,
    required this.onCreate,
  });

  final VoidCallback onClose;
  final void Function(GameState game) onCreate;

  @override
  State<_NewGameModal> createState() => _NewGameModalState();
}

class _NewGameModalState extends State<_NewGameModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _playerControllers = List.generate(4, (_) => TextEditingController());
  bool _submitting = false;
  String? _submitError;

  @override
  void dispose() {
    _nameController.dispose();
    for (final c in _playerControllers) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    _submitError = null;
    final players = _playerControllers.map((c) => c.text.trim()).toList();
    if (players.any((p) => p.isEmpty)) {
      setState(() => _submitError = 'All four player names are required.');
      return;
    }
    setState(() => _submitting = true);
    try {
      final gameService = context.read<GameService>();
      final name = _nameController.text.trim();
      final game = await gameService.createGame(players,
          name: name.isEmpty ? null : name);
      if (!mounted) return;
      widget.onCreate(game);
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _submitError = e
              .toString()
              .replaceFirst('ApiException(', '')
              .split('):')
              .join(': ');
        });
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ModalBarrier(
          color: Colors.black54,
          onDismiss: widget.onClose,
        ),
        Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              AppStrings.newGameFormTitle,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            IconButton(
                              onPressed: _submitting ? null : widget.onClose,
                              icon: const Icon(Icons.close),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: AppStrings.gameNameOptional,
                            hintText: AppStrings.gameNamePlaceholder,
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          AppStrings.playerNames,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 8),
                        for (var i = 0; i < 4; i++) ...[
                          TextFormField(
                            controller: _playerControllers[i],
                            decoration: InputDecoration(
                              labelText: '${AppStrings.player} ${i + 1}',
                              border: const OutlineInputBorder(),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty)
                                ? 'Required'
                                : null,
                          ),
                          if (i < 3) const SizedBox(height: 12),
                        ],
                        if (_submitError != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _submitError!,
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.error),
                          ),
                        ],
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _submitting ? null : widget.onClose,
                                child: const Text(AppStrings.cancel),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                onPressed: _submitting ? null : _submit,
                                child: _submitting
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2),
                                      )
                                    : const Text(AppStrings.startGame),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _GameListTile extends StatelessWidget {
  const _GameListTile({
    required this.game,
    required this.displayName,
    required this.formattedDate,
    required this.onTap,
  });

  final GameState game;
  final String displayName;
  final String formattedDate;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isActive = game.status == 'active';
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Row(
            children: [
              Icon(
                Icons.emoji_events_outlined,
                color: Theme.of(context).colorScheme.primary.withOpacity(0.8),
                size: 32,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: Theme.of(context).textTheme.titleSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      game.players.join(', '),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${AppStrings.round} ${game.currentRound} · '
                      '${AppStrings.score}: ${game.scores.join(' - ')} · $formattedDate',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isActive
                      ? Theme.of(context).colorScheme.primaryContainer
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isActive ? AppStrings.active : AppStrings.completed,
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
