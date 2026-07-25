import 'package:http/http.dart' as http;
import '../../../domain/models/rating.dart';

class RatingService {
  final http.Client _client;
  final String _baseUrl;

  RatingService({
    required http.Client client,
    required String baseUrl,
  }) : _client = client,
       _baseUrl = baseUrl;

  Future<Rating> createRating(Rating rating) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/ratings'),
      body: rating.toJson(),
    );

    if (response.statusCode == 201) {
      return Rating.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create rating');
    }
  }

  Future<List<Rating>> getRatingsForUser(String userId, {RatingType? type}) async {
    final uri = Uri.parse('$_baseUrl/ratings/$userId')
        .replace(queryParameters: {
      if (type != null) 'type': type.toString().split('.').last,
    });

    final response = await _client.get(uri);

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Rating.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch ratings');
    }
  }

  Future<double> getAverageRating(String userId, {RatingType? type}) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/ratings/$userId/average')
          .replace(queryParameters: {
        if (type != null) 'type': type.toString().split('.').last,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['average'] as num).toDouble();
    } else {
      throw Exception('Failed to fetch average rating');
    }
  }
}