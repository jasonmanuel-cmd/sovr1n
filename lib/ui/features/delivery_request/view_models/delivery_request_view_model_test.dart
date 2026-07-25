import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'delivery_request_view_model.dart';
import '../../data/repositories/delivery_request_repository.dart';
import '../../../domain/models/delivery_request.dart';

// Generate mock classes
@GenerateMocks([DeliveryRequestRepository])
import 'delivery_request_view_model_test.mocks.dart';

void main() {
  late DeliveryRequestViewModel deliveryRequestViewModel;
  late MockDeliveryRequestRepository mockDeliveryRequestRepository;

  setUp(() {
    mockDeliveryRequestRepository = MockDeliveryRequestRepository();
    deliveryRequestViewModel = DeliveryRequestViewModel(
        deliveryRequestRepository: mockDeliveryRequestRepository);
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

  group('DeliveryRequestViewModel', () {
    test('loadAvailableRequests should set requests and loading states correctly', () async {
      // Arrange
      when(mockDeliveryRequestRepository.getAvailableRequests(any, any, any))
          .thenAnswer((_) async => [testRequest]);

      // Act
      await deliveryRequestViewModel.loadAvailableRequests(0, 0, 10);

      // Assert
      expect(deliveryRequestViewModel.isLoading, false);
      expect(deliveryRequestViewModel.availableRequests, hasLength(1));
      expect(deliveryRequestViewModel.availableRequests.first.id, '1');
      expect(deliveryRequestViewModel.errorMessage, isNull);
    });

    test('loadAvailableRequests should handle errors correctly', () async {
      // Arrange
      when(mockDeliveryRequestRepository.getAvailableRequests(any, any, any))
          .thenThrow(Exception('Failed to fetch requests'));

      // Act
      await deliveryRequestViewModel.loadAvailableRequests(0, 0, 10);

      // Assert
      expect(deliveryRequestViewModel.isLoading, false);
      expect(deliveryRequestViewModel.availableRequests, isEmpty);
      expect(deliveryRequestViewModel.errorMessage, contains('Failed to fetch requests'));
    });

    test('acceptDeliveryRequest should update request status', () async {
      // Arrange
      when(mockDeliveryRequestRepository.updateDeliveryRequestStatus(any, any))
          .thenAnswer((_) async => {});

      // Act
      await deliveryRequestViewModel.acceptDeliveryRequest('1');

      // Assert
      verify(mockDeliveryRequestRepository.updateDeliveryRequestStatus('1', DeliveryStatus.assigned));
    });

    test('completeDeliveryRequest should update request status', () async {
      // Arrange
      when(mockDeliveryRequestRepository.updateDeliveryRequestStatus(any, any))
          .thenAnswer((_) async => {});

      // Act
      await deliveryRequestViewModel.completeDeliveryRequest('1');

      // Assert
      verify(mockDeliveryRequestRepository.updateDeliveryRequestStatus('1', DeliveryStatus.completed));
    });

    test('setDriverPrice should delegate to repository', () async {
      // Arrange
      when(mockDeliveryRequestRepository.setDriverPrice(any, any))
          .thenAnswer((_) async => {});

      // Act
      await deliveryRequestViewModel.setDriverPrice('1', 25.0);

      // Assert
      verify(mockDeliveryRequestRepository.setDriverPrice('1', 25.0));
    });

    test('setUserOfferPrice should delegate to repository', () async {
      // Arrange
      when(mockDeliveryRequestRepository.setUserOfferPrice(any, any))
          .thenAnswer((_) async => {});

      // Act
      await deliveryRequestViewModel.setUserOfferPrice('1', 20.0);

      // Assert
      verify(mockDeliveryRequestRepository.setUserOfferPrice('1', 20.0));
    });
  });
}