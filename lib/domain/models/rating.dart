import 'package:freezed_annotation/freezed_annotation.dart';

part 'rating.freezed.dart';
part 'rating.g.dart';

@freezed
class Rating with _$Rating {
  const factory Rating({
    required String id,
    required String deliveryRequestId,
    required String reviewerId, // Either customer or driver
    required String revieweeId, // Either driver or customer
    required double rating, // 1-5 stars
    String? comment,
    required RatingType type, // Who is being rated
    DateTime? createdAt,
  }) = _Rating;

  factory Rating.fromJson(Map<String, dynamic> json) => _$RatingFromJson(json);
}

enum RatingType {
  customerRatingDriver, // Customer rating the driver
  driverRatingCustomer, // Driver rating the customer
}