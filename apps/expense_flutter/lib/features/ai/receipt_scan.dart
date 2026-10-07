import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/ai_settings.dart';
import '../../core/categories.dart';
import '../../core/i18n.dart';
import '../../data/ai_api.dart';
import '../../data/cloudinary.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../transactions/transaction_form_sheet.dart';
import 'ai_entry_strings.dart';
import 'confirm_entry_sheet.dart';

final _grouped = NumberFormat('#,##0', 'en_US');

typedef _Saved = ({String id, double amount, String merchant, String? registeredName});

/// Photographs a receipt, reads it with AI, and saves it.
Future<void> startReceiptScan(
  BuildContext context,
  WidgetRef ref, {
  ImageSource source = ImageSource.camera,
}) async {
  final messenger = ScaffoldMessenger.of(context);
  final t = readAiEntryStrings(ref);
  final photo = await _pickPhoto(source);
  if (photo == null || !context.mounted) return;

  final useAi = ref.read(aiSettingsProvider)[AiFeature.receipt] ?? true;
  final saved = await showAiSheet<_Saved>(context, (_) => _ReceiptSheet(photo: photo, useAi: useAi));
  if (saved == null) return;

  messenger.showSnackBar(
    SnackBar(
      duration: const Duration(seconds: 6),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(t.saved(_grouped.format(saved.amount.round()), saved.merchant)),
          if (saved.registeredName != null)
            Text(t.verified(saved.registeredName!), style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ],
      ),
      action: SnackBarAction(
        label: t.edit,
        onPressed: () async {
          final tx = await ref.read(repositoryProvider).transaction(saved.id);
          if (tx != null && context.mounted) await showTransactionForm(context, existing: tx);
        },
      ),
    ),
  );
}

/// Falls back to the gallery where no camera exists, e.g. simulators.
Future<Uint8List?> _pickPhoto(ImageSource source) async {
  final picker = ImagePicker();
  Future<XFile?> pick(ImageSource s) => picker.pickImage(source: s, maxWidth: 2000, imageQuality: 85);
  XFile? file;
  try {
    file = await pick(source);
  } on PlatformException {
    if (source != ImageSource.camera) rethrow;
    file = await pick(ImageSource.gallery);
  }
  return file?.readAsBytes();
}

class _ReceiptSheet extends ConsumerStatefulWidget {
  const _ReceiptSheet({required this.photo, required this.useAi});
  final Uint8List photo;
  final bool useAi;

  @override
  ConsumerState<_ReceiptSheet> createState() => _ReceiptSheetState();
}

class _ReceiptSheetState extends ConsumerState<_ReceiptSheet> {
  bool _analyzing = true;
  EntryDraft _draft = EntryDraft.blank();
  String? _notice;

  @override
  void initState() {
    super.initState();
    if (widget.useAi) {
      _analyze();
    } else {
      _analyzing = false;
    }
  }

  void _fallBack(String? notice, [EntryDraft? draft]) {
    if (!mounted) return;
    setState(() {
      _analyzing = false;
      _notice = notice;
      if (draft != null) _draft = draft;
    });
  }

  /// A total that does not reconcile goes to the form, never saved.
  Future<void> _analyze() async {
    final t = readAiEntryStrings(ref);
    Map<String, dynamic> parsed;
    try {
      parsed = await ref.read(aiApiProvider).parseReceipt(widget.photo);
    } on AiApiException catch (e) {
      return _fallBack(e.message);
    } catch (_) {
      return _fallBack(t.uploadFailed);
    }

    final merchant = '${parsed['merchant'] ?? ''}'.trim();
    final draft = EntryDraft(
      type: TxType.expense,
      title: merchant.isEmpty ? t.fallbackMerchant : merchant,
      amount: double.tryParse('${parsed['total']}') ?? 0,
      category: categoryFrom(parsed['category']),
      date: EntryDraft.parseDay(parsed['date']),
      items: ReceiptItem.listFrom(parsed['items']),
    );
    if (parsed['confident'] != true || !draft.isValid) return _fallBack(t.doubleCheck, draft);

    final String id;
    try {
      id = await _persist(draft);
    } catch (e) {
      return _fallBack('${t.couldNotSave}: $e', draft);
    }
    if (!mounted) return;
    final registered = '${parsed['registeredName'] ?? ''}'.trim();
    Navigator.of(context).pop<_Saved>((
      id: id,
      amount: draft.amount,
      merchant: draft.title,
      registeredName: registered.isEmpty ? null : registered,
    ));
  }

  /// The photo is optional evidence, so a failed upload still saves.
  Future<String> _persist(EntryDraft draft) async {
    String? receiptUrl;
    try {
      receiptUrl = await uploadToCloudinary(widget.photo, filename: 'receipt.jpg');
    } catch (_) {
      receiptUrl = null;
    }
    final id = await ref.read(repositoryProvider).add(
          type: draft.type,
          title: draft.title,
          amount: draft.amount,
          occurredAt: draft.date,
          category: draft.category,
          items: draft.items,
          receiptUrl: receiptUrl,
        );
    ref.read(dataVersionProvider.notifier).bump();
    return id;
  }

  Future<void> _confirm(List<EntryDraft> entries) async {
    final t = readAiEntryStrings(ref);
    final draft = entries.first;
    final String id;
    try {
      id = await _persist(draft);
    } catch (e) {
      if (mounted) setState(() => _notice = '${t.couldNotSave}: $e');
      return;
    }
    if (!mounted) return;
    Navigator.of(context).pop<_Saved>((id: id, amount: draft.amount, merchant: draft.title.trim(), registeredName: null));
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tr(aiEntryStrings);
    return PopScope(
      canPop: !_analyzing,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        child: _analyzing
            ? _AnalyzingView(key: const ValueKey('analyzing'), photo: widget.photo, t: t)
            : AiSheetFrame(
                key: const ValueKey('confirm'),
                title: widget.useAi ? t.checkAndSave : t.addTransaction,
                closeLabel: t.close,
                onClose: () => Navigator.of(context).pop(),
                child: ConfirmEntryForm(
                  key: ValueKey(_draft),
                  entries: [_draft],
                  photo: widget.photo,
                  notice: _notice,
                  onSave: _confirm,
                ),
              ),
      ),
    );
  }
}

class _AnalyzingView extends StatelessWidget {
  const _AnalyzingView({super.key, required this.photo, required this.t});
  final Uint8List photo;
  final AiEntryStrings t;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(8, 0, 8, 8 + media.padding.bottom),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(36),
        child: SizedBox(
          height: media.size.height * 0.72,
          width: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.memory(photo, fit: BoxFit.cover),
              ColoredBox(
                color: Colors.black.withValues(alpha: 0.85),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox.square(
                      dimension: 56,
                      child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      t.readingReceipt,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(t.takesSeconds, style: const TextStyle(color: Colors.white60, fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
