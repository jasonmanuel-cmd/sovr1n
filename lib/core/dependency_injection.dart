import 'package:get_it/get_it.dart';
import 'package:http/http.dart' as http;
import '../data/services/auth_service.dart';
import '../data/services/delivery_request_service.dart';
import '../data/services/payment_service.dart';
import '../data/services/rating_service.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/delivery_request_repository.dart';
import '../data/repositories/payment_repository.dart';
import '../data/repositories/rating_repository.dart';
import '../ui/features/auth/view_models/auth_view_model.dart';
import '../ui/features/delivery_request/view_models/delivery_request_view_model.dart';

final GetIt locator = GetIt.instance;

void setupLocator() {
  // Services
  locator.registerLazySingleton<http.Client>(() => http.Client());
  locator.registerLazySingleton<AuthService>(() => AuthService(
        client: locator<http.Client>(),
        baseUrl: 'https://api.sovr1n.com', // Replace with actual API URL
      ));
  locator.registerLazySingleton<DeliveryRequestService>(() => DeliveryRequestService(
        client: locator<http.Client>(),
        baseUrl: 'https://api.sovr1n.com', // Replace with actual API URL
      ));
  locator.registerLazySingleton<PaymentService>(() => PaymentService(
        client: locator<http.Client>(),
        baseUrl: 'https://api.sovr1n.com', // Replace with actual API URL
      ));
  locator.registerLazySingleton<RatingService>(() => RatingService(
        client: locator<http.Client>(),
        baseUrl: 'https://api.sovr1n.com', // Replace with actual API URL
      ));

  // Repositories
  locator.registerLazySingleton<AuthRepository>(() => AuthRepository(
        authService: locator<AuthService>(),
      ));
  locator.registerLazySingleton<DeliveryRequestRepository>(() => DeliveryRequestRepository(
        deliveryRequestService: locator<DeliveryRequestService>(),
        paymentService: locator<PaymentService>(),
      ));
  locator.registerLazySingleton<PaymentRepository>(() => PaymentRepository(
        paymentService: locator<PaymentService>(),
      ));
  locator.registerLazySingleton<RatingRepository>(() => RatingRepository(
        ratingService: locator<RatingService>(),
      ));

  // ViewModels
  locator.registerFactory<AuthViewModel>(() => AuthViewModel(
        authRepository: locator<AuthRepository>(),
      ));
  locator.registerFactory<DeliveryRequestViewModel>(() => DeliveryRequestViewModel(
        deliveryRequestRepository: locator<DeliveryRequestRepository>(),
      ));
}