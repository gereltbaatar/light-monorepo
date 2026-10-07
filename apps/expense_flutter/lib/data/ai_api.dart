import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/ai_settings.dart';
import '../core/env.dart';
import '../core/settings.dart';

class AiApiException implements Exception {
  AiApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Calls the Next.js /api/ai/* routes; Gemini's key never leaves the server.
class AiApi {
  AiApi(this._ref);
  final Ref _ref;
  static const _timeout = Duration(seconds: 60);

  Map<String, String> get _headers {
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    if (token == null) throw AiApiException('Not signed in');
    final locale = _ref.read(localeProvider).name;
    final off = _ref.read(aiSettingsProvider.notifier).cookieValue;
    return {
      'Authorization': 'Bearer $token',
      'Cookie': 'locale=$locale; ai-features=$off',
    };
  }

  Uri _uri(String path) => Uri.parse('${Env.apiBaseUrl}/api/ai/$path');

  /// Returns the route's JSON; an `{error: ...}` body is thrown as AiApiException.
  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> body;
    try {
      body = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      throw AiApiException('Unexpected response (${res.statusCode})');
    }
    if (res.statusCode != 200) throw AiApiException('${body['error'] ?? 'Request failed (${res.statusCode})'}');
    if (body['error'] is String) throw AiApiException(body['error'] as String);
    return body;
  }

  Future<Map<String, dynamic>> _multipart(String path, Map<String, String> fields, http.MultipartFile file) async {
    final req = http.MultipartRequest('POST', _uri(path))
      ..headers.addAll(_headers)
      ..fields.addAll(fields)
      ..files.add(file);
    final res = await http.Response.fromStream(await req.send().timeout(_timeout));
    return _decode(res);
  }

  /// Mirrors parseReceipt: merchant, total, date, confident, items, category, registeredName.
  Future<Map<String, dynamic>> parseReceipt(Uint8List image) {
    final isPng = image.length > 4 && image[0] == 0x89 && image[1] == 0x50 && image[2] == 0x4E && image[3] == 0x47;
    return _multipart(
      'receipt',
      const {},
      http.MultipartFile.fromBytes(
        'receipt',
        image,
        filename: isPng ? 'receipt.png' : 'receipt.jpg',
        contentType: MediaType('image', isPng ? 'png' : 'jpeg'),
      ),
    );
  }

  /// Mirrors parseVoiceTransaction; [wav] must be 16 kHz mono PCM WAV.
  Future<Map<String, dynamic>> parseVoice(Uint8List wav, String today) => _multipart(
        'voice',
        {'today': today},
        http.MultipartFile.fromBytes('audio', wav, filename: 'voice.wav', contentType: MediaType('audio', 'wav')),
      );

  Future<Map<String, dynamic>> advice() async =>
      _decode(await http.get(_uri('advice'), headers: _headers).timeout(_timeout));

  Future<Map<String, dynamic>> questions() async =>
      _decode(await http.get(_uri('questions'), headers: _headers).timeout(_timeout));

  /// [history] is [{role: 'user'|'model', text}]; returns {reply}.
  Future<Map<String, dynamic>> chat(List<Map<String, String>> history) async => _decode(await http
      .post(
        _uri('chat'),
        headers: {..._headers, 'Content-Type': 'application/json'},
        body: jsonEncode({'history': history}),
      )
      .timeout(_timeout));
}

final aiApiProvider = Provider<AiApi>(AiApi.new);
