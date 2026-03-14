import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:whist_flutter/services/auth_service.dart';

/// Sample JWT (minimal valid-looking shape for tests; not a real secret).
const _sampleJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE2MTYyMzkwMjJ9.abc';

void main() {
  group('NeonAuthResponseParser.extractToken', () {
    test('extracts token from data.session.token (Neon get-session / sign-in)',
        () {
      final body = jsonEncode({
        'data': {
          'session': {'token': _sampleJwt},
          'user': {'id': 'u1', 'email': 'a@b.c', 'name': 'A'},
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from data.session.accessToken', () {
      final body = jsonEncode({
        'data': {
          'session': {'accessToken': _sampleJwt},
          'user': {'id': 'u1', 'email': 'a@b.c'},
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from data.session.access_token (Neon Auth snake_case)',
        () {
      final body = jsonEncode({
        'data': {
          'session': {'access_token': _sampleJwt},
          'user': {'id': 'u1', 'email': 'a@b.c'},
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test(
        'prefers data.session.token over data.session.accessToken when both present',
        () {
      final body = jsonEncode({
        'data': {
          'session': {'token': _sampleJwt, 'accessToken': 'other'},
          'user': {},
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from data.token', () {
      final body = jsonEncode({
        'data': {
          'token': _sampleJwt,
          'user': {'id': 'u1', 'email': 'a@b.c'}
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from top-level session.token', () {
      final body = jsonEncode({
        'session': {'token': _sampleJwt},
        'user': {'id': 'u1', 'email': 'a@b.c'},
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from top-level session.accessToken', () {
      final body = jsonEncode({
        'session': {'accessToken': _sampleJwt},
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('extracts token from top-level token', () {
      final body = jsonEncode({'token': _sampleJwt});
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });

    test('returns null for non-JWT string in token field', () {
      final body = jsonEncode({
        'data': {
          'session': {'token': 'not-a-jwt'}
        }
      });
      expect(NeonAuthResponseParser.extractToken(body), isNull);
    });

    test('returns null for empty or invalid JSON', () {
      expect(NeonAuthResponseParser.extractToken(''), isNull);
      expect(NeonAuthResponseParser.extractToken('{'), isNull);
      expect(NeonAuthResponseParser.extractToken('null'), isNull);
    });

    test('finds JWT in nested object when no standard path present', () {
      final body = jsonEncode({
        'data': {
          'nested': {
            'session': {'token': _sampleJwt}
          }
        },
      });
      expect(NeonAuthResponseParser.extractToken(body), _sampleJwt);
    });
  });

  group('NeonAuthResponseParser.parseUser', () {
    test('parses user from data.user (Neon get-session shape)', () {
      final data = {
        'data': {
          'user': {'id': 'u1', 'email': 'a@b.c', 'name': 'Alice'},
          'session': {'token': _sampleJwt},
        },
      };
      final user = NeonAuthResponseParser.parseUser(data);
      expect(user, isNotNull);
      expect(user!.id, 'u1');
      expect(user.email, 'a@b.c');
      expect(user.name, 'Alice');
    });

    test('parses user from top-level user when data.user absent', () {
      final data = {
        'user': {'id': 'u2', 'email': 'b@c.d', 'name': 'Bob'},
      };
      final user = NeonAuthResponseParser.parseUser(data);
      expect(user, isNotNull);
      expect(user!.id, 'u2');
      expect(user.email, 'b@c.d');
      expect(user.name, 'Bob');
    });

    test('prefers data.user over top-level user', () {
      final data = {
        'data': {
          'user': {'id': 'from-data', 'email': 'd@e.f'}
        },
        'user': {'id': 'top-level', 'email': 't@l.e'},
      };
      final user = NeonAuthResponseParser.parseUser(data);
      expect(user, isNotNull);
      expect(user!.id, 'from-data');
      expect(user.email, 'd@e.f');
    });

    test('handles user with null name', () {
      final data = {
        'data': {
          'user': {'id': 'u3', 'email': 'c@d.e'}
        },
      };
      final user = NeonAuthResponseParser.parseUser(data);
      expect(user, isNotNull);
      expect(user!.name, isNull);
    });

    test('returns null for non-map data', () {
      expect(NeonAuthResponseParser.parseUser(null), isNull);
      expect(NeonAuthResponseParser.parseUser('string'), isNull);
      expect(NeonAuthResponseParser.parseUser([]), isNull);
    });

    test('returns null when no user object present', () {
      final data = {
        'data': {
          'session': {'token': _sampleJwt}
        }
      };
      expect(NeonAuthResponseParser.parseUser(data), isNull);
    });
  });
}
