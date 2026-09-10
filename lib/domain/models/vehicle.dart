import 'package:freezed_annotation/freezed_annotation.dart';

part 'vehicle.freezed.dart';
part 'vehicle.g.dart';

@freezed
class Vehicle with _$Vehicle {
  const factory Vehicle({
    required String id,
    required String ownerId,
    required String vehicleType,
    required String licensePlate,
    required String make,
    required String model,
    required int year,
    required double capacityKg,
    required bool isAvailable,
    DateTime? createdAt,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);
}