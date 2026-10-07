import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../core/env.dart';

/// Unsigned upload, the same preset the web app uses; returns the secure URL.
Future<String> uploadToCloudinary(Uint8List bytes, {String filename = 'upload.jpg'}) async {
  if (Env.cloudinaryCloudName.isEmpty || Env.cloudinaryUploadPreset.isEmpty) {
    throw StateError('Cloudinary is not configured in env.json');
  }
  final req = http.MultipartRequest(
    'POST',
    Uri.parse('https://api.cloudinary.com/v1_1/${Env.cloudinaryCloudName}/image/upload'),
  )
    ..fields['upload_preset'] = Env.cloudinaryUploadPreset
    ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));
  final res = await http.Response.fromStream(await req.send());
  if (res.statusCode != 200) throw StateError('Image upload failed (${res.statusCode})');
  final url = (jsonDecode(res.body) as Map<String, dynamic>)['secure_url'];
  if (url is! String) throw StateError('Image upload returned no URL');
  return url;
}
