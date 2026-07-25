import '../../../domain/models/payment.dart';
import '../services/payment_service.dart';

class PaymentRepository {
  final PaymentService _paymentService;

  PaymentRepository({required PaymentService paymentService}) : _paymentService = paymentService;

  Future<Payment> processPlatformFee(String deliveryRequestId, double amount) async {
    return await _paymentService.processPlatformFee(deliveryRequestId, amount);
  }

  Future<Payment> processDriverPayout(String deliveryRequestId, double amount) async {
    return await _paymentService.processDriverPayout(deliveryRequestId, amount);
  }

  Future<List<Payment>> getPaymentHistory(String userId) async {
    return await _paymentService.getPaymentHistory(userId);
  }
}