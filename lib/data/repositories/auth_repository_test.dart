import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'auth_repository.dart';
import '../../domain/models/user.dart';
import '../services/auth_service.dart';

// Generate mock classes
@GenerateMocks([AuthService])
import 'auth_repository_test.mocks.dart';

void main() {
  late AuthRepository authRepository;
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
    authRepository = AuthRepository(authService: mockAuthService);
  });

  const testUser = User(
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    userType: UserType.customer,
    isVerified: true,
  );

  group('AuthRepository', () {
    test('login should delegate to auth service', () async {
      // Arrange
      when(mockAuthService.login(any, any))
          .thenAnswer((_) async => testUser);

      // Act
      final result = await authRepository.login('test@example.com', 'password');

      // Assert
      expect(result, testUser);
      verify(mockAuthService.login('test@example.com', 'password'));
    });

    test('register should delegate to auth service', () async {
      // Arrange
      when(mockAuthService.register(any, any))
          .thenAnswer((_) async => testUser);

      // Act
      final result = await authRepository.register(testUser, 'password');

      // Assert
      expect(result, testUser);
      verify(mockAuthService.register(testUser, 'password'));
    });
  });
}