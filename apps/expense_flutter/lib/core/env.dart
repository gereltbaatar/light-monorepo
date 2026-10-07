/// Values come from `--dart-define-from-file=env.json` (see env.example.json).
abstract final class Env {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// The deployed Next.js app; AI features call its API in a later phase.
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Unsigned upload preset, same as the web app's NEXT_PUBLIC_CLOUDINARY_*.
  static const cloudinaryCloudName = String.fromEnvironment('CLOUDINARY_CLOUD_NAME');
  static const cloudinaryUploadPreset = String.fromEnvironment('CLOUDINARY_UPLOAD_PRESET');

  /// Deep link Supabase redirects to after Google sign-in.
  static const authRedirect = 'mn.light.expense://login-callback';

  static bool get isConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
