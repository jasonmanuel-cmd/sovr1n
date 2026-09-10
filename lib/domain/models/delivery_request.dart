import 'package:freezed_annotation/freezed_annotation.dart';

part 'delivery_request.freezed.dart';
part 'delivery_request.g.dart';

@freezed
class DeliveryRequest with _$DeliveryRequest {
  const factory DeliveryRequest({
    required String id,
    required String customerId,
    required String? driverId,
    required String itemDescription,
    required double pickupLatitude,
    required double pickupLongitude,
    required double dropoffLatitude,
    required double dropoffLongitude,
    required String pickupAddress,
    required String dropoffAddress,
    required DateTime pickupTime,
    required double weightKg,
    required double dimensionsCubicMeters,
    required DeliveryStatus status,
    double? userOfferPrice, // Price offered by the customer
    double? driverPricePerLoad, // Price the driver wants per load
    double? platformFee, // Fee taken by the platform
    double? finalPrice, // Final price after negotiations and fee
    double? currentDriverLatitude, // For real-time tracking
    double? currentDriverLongitude, // For real-time tracking
    double? currentDriverBearing, // Direction the driver is moving (degrees)
    DateTime? lastLocationUpdate, // Timestamp of last location update
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _DeliveryRequest;

  factory DeliveryRequest.fromJson(Map<String, dynamic> json) => _$DeliveryRequestFromJson(json);
}

enum DeliveryStatus {
  pending,
  assigned,
  inProgress,
  completed,
  cancelled,
}