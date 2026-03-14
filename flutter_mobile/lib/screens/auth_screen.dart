import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_strings.dart';
import '../services/auth_service.dart';

/// Google-style icon (blue "g").
class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Icon(
      Icons.g_mobiledata,
      size: 22,
      color: Color(0xFF4285F4),
    );
  }
}

/// Login / sign-up screen (Neon Auth). Toggle between modes; show errors.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _loginKey = GlobalKey<FormState>();
  final _signupKey = GlobalKey<FormState>();
  final _loginEmail = TextEditingController();
  final _loginPassword = TextEditingController();
  final _signupName = TextEditingController();
  final _signupEmail = TextEditingController();
  final _signupPassword = TextEditingController();

  bool _isLoginMode = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _loginEmail.dispose();
    _loginPassword.dispose();
    _signupName.dispose();
    _signupEmail.dispose();
    _signupPassword.dispose();
    super.dispose();
  }

  void _clearError() {
    if (_errorMessage != null) setState(() => _errorMessage = null);
  }

  Future<void> _onLogin() async {
    if (!(_loginKey.currentState?.validate() ?? false) || _isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signIn(_loginEmail.text.trim(), _loginPassword.text);
      if (!mounted) return;
      // AuthService.notifyListeners() will cause AuthGate to rebuild and show game.
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message.replaceAll(RegExp(r'^\.+\s*'), '').trim();
        if (_errorMessage!.isEmpty) _errorMessage = AppStrings.loginFailed;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = AppStrings.loginFailed;
        _isLoading = false;
      });
    }
  }

  Future<void> _onSignup() async {
    if (!(_signupKey.currentState?.validate() ?? false) || _isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signUp(
        _signupEmail.text.trim(),
        _signupPassword.text,
        _signupName.text.trim(),
      );
      if (!mounted) return;
      // AuthService.notifyListeners() will cause AuthGate to rebuild and show game.
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message.replaceAll(RegExp(r'^\.+\s*'), '').trim();
        if (_errorMessage!.isEmpty) _errorMessage = AppStrings.signupFailed;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = AppStrings.signupFailed;
        _isLoading = false;
      });
    }
  }

  Future<void> _onGoogleSignIn() async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signInWithGoogle();
      if (!mounted) return;
      // AuthService.notifyListeners() will cause AuthGate to rebuild.
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message.replaceAll(RegExp(r'^\.+\s*'), '').trim();
        if (_errorMessage!.isEmpty) {
          _errorMessage = AppStrings.googleSignInFailed;
        }
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = AppStrings.googleSignInFailed;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _isLoginMode ? AppStrings.signIn : AppStrings.signUp,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 20),
                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .errorContainer
                                .withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      if (_isLoginMode) _loginForm() else _signupForm(),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: _isLoading
                            ? null
                            : () {
                                _clearError();
                                setState(() => _isLoginMode = !_isLoginMode);
                              },
                        child: Text(
                          _isLoginMode ? AppStrings.signUp : AppStrings.signIn,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _loginForm() {
    return Form(
      key: _loginKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _loginEmail,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: AppStrings.email,
              hintText: AppStrings.enterEmail,
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) {
                return AppStrings.emailRequired;
              }
              if (!RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(v.trim())) {
                return AppStrings.invalidEmail;
              }
              return null;
            },
            onChanged: (_) => _clearError(),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _loginPassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: AppStrings.password,
              hintText: AppStrings.enterPassword,
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return AppStrings.passwordRequired;
              if (v.length < 6) return AppStrings.passwordMinLength;
              return null;
            },
            onChanged: (_) => _clearError(),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _isLoading ? null : _onLogin,
            child: Text(_isLoading ? AppStrings.signingIn : AppStrings.signIn),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Expanded(child: Divider()),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  AppStrings.or,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ),
              const Expanded(child: Divider()),
            ],
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: _isLoading ? null : _onGoogleSignIn,
            icon: _GoogleIcon(),
            label: Text(
              _isLoading
                  ? AppStrings.connecting
                  : AppStrings.continueWithGoogle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _signupForm() {
    return Form(
      key: _signupKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _signupName,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: AppStrings.name,
              hintText: AppStrings.enterName,
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return AppStrings.nameRequired;
              return null;
            },
            onChanged: (_) => _clearError(),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _signupEmail,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: AppStrings.email,
              hintText: AppStrings.enterEmail,
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) {
                return AppStrings.emailRequired;
              }
              if (!RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(v.trim())) {
                return AppStrings.invalidEmail;
              }
              return null;
            },
            onChanged: (_) => _clearError(),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _signupPassword,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: AppStrings.password,
              hintText: AppStrings.enterPassword,
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return AppStrings.passwordRequired;
              if (v.length < 6) return AppStrings.passwordMinLength;
              return null;
            },
            onChanged: (_) => _clearError(),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _isLoading ? null : _onSignup,
            child: Text(
              _isLoading ? AppStrings.creatingAccount : AppStrings.signUp,
            ),
          ),
        ],
      ),
    );
  }
}
