import 'package:http/http.dart' as http;
import '../../../domain/models/user.dart';

class AuthService {
  final http.Client _client;
  final String _baseUrl;

  AuthService({
    required http.Client client,
    required String baseUrl,
  }) : _client = client,
       _baseUrl = baseUrl;

  Future<User> login(String email, String password) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/login'),
      body: {
        'email': email,
        'password': password,
      },
    );

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to login');
    }
  }

  Future<User> register(User user, String password) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/register'),
      body: {
        ...user.toJson(),
        'password': password,
      },
    );

    if (response.statusCode == 201) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to register');
    }
  }
}