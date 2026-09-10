import '../../../domain/models/delivery_request.dart';
import '../../../domain/models/payment.dart';
import '../services/delivery_request_service.dart';
import '../services/payment_service.dart';

class DeliveryRequestRepository {
  final DeliveryRequestService _deliveryRequestService;
  final PaymentService _paymentService;
  DeliveryRequest? _cachedRequest;

  DeliveryRequestRepository({
    required DeliveryRequestService deliveryRequestService,
    required PaymentService paymentService,
  }) : _deliveryRequestService = deliveryRequestService,
       _paymentService = paymentService;

  Future<DeliveryRequest> createDeliveryRequest(DeliveryRequest request) async {
    final createdRequest = await _deliveryRequestService.createDeliveryRequest(request);
    _cachedRequest = createdRequest;
    return createdRequest;
  }

  Future<List<DeliveryRequest>> getAvailableRequests(double latitude, double longitude, double radiusKm) async {
    return await _deliveryRequestService.getAvailableRequests(latitude, longitude, radiusKm);
  }

  Future<void> updateDeliveryRequestStatus(String requestId, DeliveryStatus status) async {
    await _deliveryRequestService.updateDeliveryRequestStatus(requestId, status);
    
    // Update cache if we have the request cached
    if (_cachedRequest?.id == requestId) {
      _cachedRequest = _cachedRequest?.copyWith(status: status);
    }
  }

  Future<void> setDriverPrice(String requestId, double pricePerLoad) async {
    await _deliveryRequestService.setDriverPrice(requestId, pricePerLoad);
    
    // Update cache if we have the request cached
    if (_cachedRequest?.id == requestId) {
      _cachedRequest = _cachedRequest?.copyWith(driverPricePerLoad: pricePerLoad);
    }
  }

  Future<void> setUserOfferPrice(String requestId, double offerPrice) async {
    await _deliveryRequestService.setUserOfferPrice(requestId, offerPrice);
    
    // Update cache if we have the request cached
    if (_cachedRequest?.id == requestId) {
      _cachedRequest = _cachedRequest?.copyWith(userOfferPrice: offerPrice);
    }
  }

  Future<void> updateDriverLocation(String requestId, double latitude, double longitude, [double? bearing]) async {
    await _deliveryRequestService.updateDriverLocation(requestId, latitude, longitude, bearing);
    
    // Update cache if we have the request cached
    if (_cachedRequest?.id == requestId) {
      _cachedRequest = _cachedRequest?.copyWith(
        currentDriverLatitude: latitude,
        currentDriverLongitude: longitude,
        currentDriverBearing: bearing,
        lastLocationUpdate: DateTime.now(),
      );
    }
  }

  Future<DeliveryRequest> completeDeliveryRequest(String requestId) async {
    // First update the status to completed
    await _deliveryRequestService.updateDeliveryRequestStatus(requestId, DeliveryStatus.completed);
    
    // Then process payments if we have the necessary price information
    final deliveryRequest = await _getDeliveryRequest(requestId);
    if (deliveryRequest.driverPricePerLoad != null && 
        deliveryRequest.userOfferPrice != null) {
      
      // Calculate platform fee (small percentage, e.g., 10%)
      final platformFee = (deliveryRequest.driverPricePerLoad! * 0.10).ceilToDouble();
      
      // Process platform fee from customer to platform
      await _paymentService.processPlatformFee(
        requestId, 
        platformFee
      );
      
      // Process driver payout from platform to driver
      await _paymentService.processDriverPayout(
        requestId, 
        deliveryRequest.driverPricePerLoad!
      );
    }
    
    // Update cache if we have the request cached
    if (_cachedRequest?.id == requestId) {
      _cachedRequest = _cachedRequest?.copyWith(
        status: DeliveryStatus.completed,
        platformFee: platformFee,
        finalPrice: deliveryRequest.driverPricePerLoad,
      );
    }
    
    // Return updated request
    return await _getDeliveryRequest(requestId);
  }

  Future<DeliveryRequest> _getDeliveryRequest(String id) async {
    // In a real implementation, this would fetch from the API
    // For now, we'll return cached request if available
    if (_cachedRequest?.id == id) {
      return _cachedRequest!;
    }
    throw Exception('Delivery request not found');
  }

  Future<DeliveryRequest> getDeliveryRequestById(String id) async {
    return await _getDeliveryRequest(id);
  }
}