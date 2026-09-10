import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'delivery_request_repository.dart';
import '../../domain/models/delivery_request.dart';
import '../services/delivery_request_service.dart';

// Generate mock classes
@GenerateMocks([DeliveryRequestService])
import 'delivery_request_repository_test.mocks.dart';

void main() {
  late DeliveryRequestRepository deliveryRequestRepository;
  late MockDeliveryRequestService mockDeliveryRequestService;

  setUp(() {
    mockDeliveryRequestService = MockDeliveryRequestService();
    deliveryRequestRepository = DeliveryRequestRepository(
        deliveryRequestService: mockDeliveryRequestService);
  });

  const testRequest = DeliveryRequest(
    id: '1',
    customerId: 'customer1',
    driverId: null,
    itemDescription: 'Test Item',
    pickupLatitude: 40.7128,
    pickupLongitude: -74.0060,
    dropoffLatitude: 40.7589,
    dropoffLongitude: -73.9851,
    pickupAddress: 'New York, NY',
    dropoffAddress: 'Brooklyn, NY',
    pickupTime: DateTime.now(),
    weightKg: 10.0,
    dimensionsCubicMeters: 1.0,
    status: DeliveryStatus.pending,
  );

  group('DeliveryRequestRepository', () {
    test('createDeliveryRequest should delegate to service and cache result', () async {
      // Arrange
      when(mockDeliveryRequestService.createDeliveryRequest(any))
          .thenAnswer((_) async => testRequest);

      // Act
      final result = await deliveryRequestRepository.createDeliveryRequest(testRequest);

      // Assert
      expect(result, testRequest);
      expect(deliveryRequestRepository._cachedRequest, testRequest);
      verify(mockDeliveryRequestService.createDeliveryRequest(testRequest));
    });

    test('getAvailableRequests should delegate to service', () async {
      // Arrange
      when(mockDeliveryRequestService.getAvailableRequests(any, any, any))
          .thenAnswer((_) async => [testRequest]);

      // Act
      final result = await deliveryRequestRepository.getAvailableRequests(0, 0, 10);

      // Assert
      expect(result, [testRequest]);
      verify(mockDeliveryRequestService.getAvailableRequests(0, 0, 10));
    });

    test('updateDeliveryRequestStatus should delegate to service and update cache', () async {
      // Arrange
      when(mockDeliveryRequestService.updateDeliveryRequestStatus(any, any))
          .thenAnswer((_) async => {});
      deliveryRequestRepository._cachedRequest = testRequest;

      // Act
      await deliveryRequestRepository.updateDeliveryRequestStatus('1', DeliveryStatus.completed);

      // Assert
      verify(mockDeliveryRequestService.updateDeliveryRequestStatus('1', DeliveryStatus.completed));
      expect(deliveryRequestRepository._cachedRequest?.status, DeliveryStatus.completed);
    });

    test('setDriverPrice should delegate to service and update cache', () async {
      // Arrange
      when(mockDeliveryRequestService.setDriverPrice(any, any))
          .thenAnswer((_) async => {});
      deliveryRequestRepository._cachedRequest = testRequest;

      // Act
      await deliveryRequestRepository.setDriverPrice('1', 25.0);

      // Assert
      verify(mockDeliveryRequestService.setDriverPrice('1', 25.0));
      expect(deliveryRequestRepository._cachedRequest?.driverPricePerLoad, 25.0);
    });

    test('setUserOfferPrice should delegate to service and update cache', () async {
      // Arrange
      when(mockDeliveryRequestService.setUserOfferPrice(any, any))
          .thenAnswer((_) async => {});
      deliveryRequestRepository._cachedRequest = testRequest;

      // Act
      await deliveryRequestRepository.setUserOfferPrice('1', 20.0);

      // Assert
      verify(mockDeliveryRequestService.setUserOfferPrice('1', 20.0));
      expect(deliveryRequestRepository._cachedRequest?.userOfferPrice, 20.0);
    });

    test('getDeliveryRequestById should return cached request if matches', () async {
      // Arrange
      deliveryRequestRepository._cachedRequest = testRequest;

      // Act
      final result = await deliveryRequestRepository.getDeliveryRequestById('1');

      // Assert
      expect(result, testRequest);
    });

    test('getDeliveryRequestById should throw exception if no cached match', () async {
      // Arrange
      deliveryRequestRepository._cachedRequest = null;

      // Act & Assert
      expect(() => deliveryRequestRepository.getDeliveryRequestById('1'), throwsException);
    });
  });
}