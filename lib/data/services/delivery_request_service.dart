import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../domain/models/delivery_request.dart';

class DeliveryRequestService {
  final http.Client _client;
  final String _baseUrl;

  DeliveryRequestService({
    required http.Client client,
    required String baseUrl,
  }) : _client = client,
       _baseUrl = baseUrl;

  Future<DeliveryRequest> createDeliveryRequest(DeliveryRequest request) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/delivery-requests'),
      body: jsonEncode(request.toJson()),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 201) {
      return DeliveryRequest.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create delivery request');
    }
  }

  Future<List<DeliveryRequest>> getAvailableRequests(double latitude, double longitude, double radiusKm) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/delivery-requests/available')
          .replace(queryParameters: {
        'lat': latitude.toString(),
        'lng': longitude.toString(),
        'radius': radiusKm.toString(),
      }),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => DeliveryRequest.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch available requests');
    }
  }

  Future<void> updateDeliveryRequestStatus(String requestId, DeliveryStatus status) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/delivery-requests/$requestId/status'),
      body: jsonEncode({'status': status.toString().split('.').last}),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update delivery request status');
    }
  }

  Future<void> setDriverPrice(String requestId, double pricePerLoad) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/delivery-requests/$requestId/driver-price'),
      body: jsonEncode({'pricePerLoad': pricePerLoad}),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to set driver price');
    }
  }

  Future<void> setUserOfferPrice(String requestId, double offerPrice) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/delivery-requests/$requestId/user-offer-price'),
      body: jsonEncode({'offerPrice': offerPrice}),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to set user offer price');
    }
  }

  Future<void> updateDriverLocation(String requestId, double latitude, double longitude, [double? bearing]) async {
    final response = await _client.patch(
      Uri.parse('$_baseUrl/delivery-requests/$requestId/driver-location'),
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        if (bearing != null) 'bearing': bearing,
      }),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update driver location');
    }
  }
}