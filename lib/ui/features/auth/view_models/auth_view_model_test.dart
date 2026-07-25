import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:provider/provider.dart';
import 'auth_view_model.dart';
import '../../data/repositories/auth_repository.dart';
import '../../../domain/models/user.dart';

// Generate mock classes
@GenerateMocks([AuthRepository])
import 'auth_view_model_test.mocks.dart';

void main() {
  late AuthViewModel authViewModel;
  late MockAuthRepository mockAuthRepository;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    authViewModel = AuthViewModel(authRepository: mockAuthRepository);
  });

  const testUser = User(
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    userType: UserType.customer,
    isVerified: true,
  );

  group('AuthViewModel', () {
    test('login should set user and loading states correctly', () async {
      // Arrange
      when(mockAuthRepository.login(any, any))
          .thenAnswer((_) async => testUser);

      // Act
      await authViewModel.login('test@example.com', 'password');

      // Assert
      expect(authViewModel.isLoading, false);
      expect(authViewModel.user, testUser);
      expect(authViewModel.errorMessage, isNull);
    });

    test('login should handle errors correctly', () async {
      // Arrange
      when(mockAuthRepository.login(any, any))
          .thenThrow(Exception('Invalid credentials'));

      // Act
      await authViewModel.login('test@example.com', 'wrong_password');

      // Assert
      expect(authViewModel.isLoading, false);
      expect(authViewModel.user, isNull);
      expect(authViewModel.errorMessage, contains('Invalid credentials'));
    });

    test('logout should clear user', () async {
      // Arrange
      authViewModel._user = testUser;

      // Act
      authViewModel.logout();

      // Assert
      expect(authViewModel.user, isNull);
    });
  });
}