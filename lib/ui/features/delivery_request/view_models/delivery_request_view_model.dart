import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../domain/models/delivery_request.dart';
import '../../../domain/models/vehicle.dart';
import '../../../domain/models/rating.dart';
import '../../../data/repositories/delivery_request_repository.dart';
import '../../../data/repositories/rating_repository.dart';

class DeliveryRequestViewModel extends ChangeNotifier {
  final DeliveryRequestRepository _deliveryRequestRepository;
  final RatingRepository _ratingRepository;

  DeliveryRequestViewModel({
    required DeliveryRequestRepository deliveryRequestRepository,
    required RatingRepository ratingRepository,
  }) : _deliveryRequestRepository = deliveryRequestRepository,
       _ratingRepository = ratingRepository;

  DeliveryRequest? _selectedRequest;
  DeliveryRequest? get selectedRequest => _selectedRequest;

  List<DeliveryRequest> _availableRequests = [];
  List<DeliveryRequest> get availableRequests => _availableRequests;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // Real-time location tracking
  StreamSubscription<DeliveryRequest>? _locationSubscription;
  bool _isTrackingLocation = false;
  bool get isTrackingLocation => _isTrackingLocation;

  Future<void> createDeliveryRequest(DeliveryRequest request) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final createdRequest = await _deliveryRequestRepository.createDeliveryRequest(request);
      _selectedRequest = createdRequest;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAvailableRequests(double latitude, double longitude, double radiusKm) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _availableRequests = await _deliveryRequestRepository.getAvailableRequests(
          latitude, longitude, radiusKm);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> acceptDeliveryRequest(String requestId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _deliveryRequestRepository.updateDeliveryRequestStatus(
          requestId, DeliveryStatus.assigned);
      
      // Update the request in our list
      final index = _availableRequests.indexWhere((req) => req.id == requestId);
      if (index != -1) {
        _availableRequests[index] = _availableRequests[index].copyWith(
            status: DeliveryStatus.assigned);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> completeDeliveryRequest(String requestId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _deliveryRequestRepository.updateDeliveryRequestStatus(
          requestId, DeliveryStatus.completed);
      
      // Update the request in our list
      final index = _availableRequests.indexWhere((req) => req.id == requestId);
      if (index != -1) {
        _availableRequests[index] = _availableRequests[index].copyWith(
            status: DeliveryStatus.completed);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setDriverPrice(String requestId, double pricePerLoad) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _deliveryRequestRepository.setDriverPrice(requestId, pricePerLoad);
      
      // Update the request in our list if we have it cached
      final index = _availableRequests.indexWhere((req) => req.id == requestId);
      if (index != -1) {
        _availableRequests[index] = _availableRequests[index].copyWith(
            driverPricePerLoad: pricePerLoad);
      }
      
      // Also update selected request if it matches
      if (_selectedRequest?.id == requestId) {
        _selectedRequest = _selectedRequest?.copyWith(driverPricePerLoad: pricePerLoad);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setUserOfferPrice(String requestId, double offerPrice) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _deliveryRequestRepository.setUserOfferPrice(requestId, offerPrice);
      
      // Update the request in our list if we have it cached
      final index = _availableRequests.indexWhere((req) => req.id == requestId);
      if (index != -1) {
        _availableRequests[index] = _availableRequests[index].copyWith(
            userOfferPrice: offerPrice);
      }
      
      // Also update selected request if it matches
      if (_selectedRequest?.id == requestId) {
        _selectedRequest = _selectedRequest?.copyWith(userOfferPrice: offerPrice);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> startTrackingLocation(String requestId) async {
    if (_isTrackingLocation) {
      await stopTrackingLocation();
    }

    _isTrackingLocation = true;
    notifyListeners();

    // In a real implementation, we'd set up a real-time listener
    // For now, we'll simulate periodic updates
    _locationSubscription = Stream.periodic(const Duration(seconds: 5))
        .asyncMap((_) async {
          // Simulate getting updated location from service
          // In reality, this would come from a WebSocket or similar
          if (_selectedRequest != null && 
              _selectedRequest!.id == requestId &&
              _selectedRequest!.currentDriverLatitude != null) {
            
            // Simulate small movement
            final lat = _selectedRequest!.currentDriverLatitude! + (0.0001 * (DateTime.now().millisecondsSinceEpoch % 20 - 10));
            final lng = _selectedRequest!.currentDriverLongitude! + (0.0001 * (DateTime.now().millisecondsSinceEpoch % 20 - 10));
            final bearing = (DateTime.now().millisecondsSinceEpoch % 360).toDouble();
            
            await _deliveryRequestRepository.updateDriverLocation(requestId, lat, lng, bearing);
            return await _deliveryRequestRepository.getDeliveryRequestById(requestId);
          }
          return _selectedRequest!;
        })
        .listen((updatedRequest) {
          // Update our selected request with the latest location data
          _selectedRequest = updatedRequest;
          notifyListeners();
        });
  }

  Future<void> stopTrackingLocation() async {
    _isTrackingLocation = false;
    await _locationSubscription?.cancel();
    _locationSubscription = null;
    notifyListeners();
  }

  Future<void> createRating(Rating rating) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final createdRating = await _ratingRepository.createRating(rating);
      // In a real app, we might update some state with the new rating
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<double> getAverageRating(String userId, {RatingType? type}) async {
    return await _ratingRepository.getAverageRating(userId, type: type);
  }

  Future<List<Rating>> getRatingsForUser(String userId, {RatingType? type}) async {
    return await _ratingRepository.getRatingsForUser(userId, type: type);
  }

  void selectRequest(DeliveryRequest request) {
    _selectedRequest = request;
    notifyListeners();
  }

  void clearSelection() {
    _selectedRequest = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopTrackingLocation();
    super.dispose();
  }
}