import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment.freezed.dart';
part 'payment.g.dart';

@freezed
class Payment with _$Payment {
  const factory Payment({
    required String id,
    required String deliveryRequestId,
    required String payerId, // Either customer or driver
    required String payeeId, // Either driver or platform
    required double amount,
    required PaymentType type,
    required PaymentStatus status,
    String? transactionId,
    DateTime? createdAt,
    DateTime? processedAt,
  }) = _Payment;

  factory Payment.fromJson(Map<String, dynamic> json) => _$PaymentFromJson(json);
}

enum PaymentType {
  platformFee, // Fee charged to customer for using the platform
  driverPayout, // Payment to driver for completed delivery
}

enum PaymentStatus {
  pending,
  processing,
  completed,
  failed,
  refunded,
}