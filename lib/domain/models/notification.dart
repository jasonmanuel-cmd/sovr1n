import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification.freezed.dart';
part 'notification.g.dart';

@freezed
class Notification with _$Notification {
  const factory Notification({
    required String id,
    required String recipientId,
    required String title,
    required String body,
    required NotificationType type,
    String? data, // Optional additional data
    required bool isRead,
    DateTime? createdAt,
  }) = _Notification;

  factory Notification.fromJson(Map<String, dynamic> json) => _$NotificationFromJson(json);
}

enum NotificationType {
  deliveryAssigned, // Delivery request assigned to driver
  deliveryAccepted, // Customer's delivery accepted by driver
  deliveryInProgress, // Driver picked up the item
  deliveryCompleted, // Delivery completed
  deliveryCancelled, // Delivery cancelled
  newMessage, // New in-app message
  ratingReceived, // Received a new rating
  promotional, // Promotional notification
}