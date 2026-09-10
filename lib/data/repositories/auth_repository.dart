import '../../../domain/models/user.dart';
import '../services/auth_service.dart';

class AuthRepository {
  final AuthService _authService;

  AuthRepository({required AuthService authService}) : _authService = authService;

  Future<User> login(String email, String password) async {
    return await _authService.login(email, password);
  }

  Future<User> register(User user, String password) async {
    return await _authService.register(user, password);
  }
}