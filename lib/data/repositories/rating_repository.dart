import '../../../domain/models/rating.dart';
import '../services/rating_service.dart';

class RatingRepository {
  final RatingService _ratingService;

  RatingRepository({required RatingService ratingService}) : _ratingService = ratingService;

  Future<Rating> createRating(Rating rating) async {
    return await _ratingService.createRating(rating);
  }

  Future<List<Rating>> getRatingsForUser(String userId, {RatingType? type}) async {
    return await _ratingService.getRatingsForUser(userId, type: type);
  }

  Future<double> getAverageRating(String userId, {RatingType? type}) async {
    return await _ratingService.getAverageRating(userId, type: type);
  }
}