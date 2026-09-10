import 'package:http/http.dart' as http;
import '../../../domain/models/payment.dart';
import '../../../domain/models/delivery_request.dart';

class PaymentService {
  final http.Client _client;
  final String _baseUrl;

  PaymentService({
    required http.Client client,
    required String baseUrl,
  }) : _client = client,
       _baseUrl = baseUrl;

  Future<Payment> processPlatformFee(String deliveryRequestId, double amount) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/payments/platform-fee'),
      body: {
        'deliveryRequestId': deliveryRequestId,
        'amount': amount.toString(),
      },
    );

    if (response.statusCode == 201) {
      return Payment.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to process platform fee');
    }
  }

  Future<Payment> processDriverPayout(String deliveryRequestId, double amount) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/payments/driver-payout'),
      body: {
        'deliveryRequestId': deliveryRequestId,
        'amount': amount.toString(),
      },
    );

    if (response.statusCode == 201) {
      return Payment.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to process driver payout');
    }
  }

  Future<List<Payment>> getPaymentHistory(String userId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/payments/history/$userId'),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Payment.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch payment history');
    }
  }
}