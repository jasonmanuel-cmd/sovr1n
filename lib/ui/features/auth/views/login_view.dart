import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/auth_view_model.dart';
import '../../core/widgets/custom_text_field.dart';
import '../../core/widgets/custom_button.dart';

class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final authViewModel = Provider.of<AuthViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CustomTextField(
              label: 'Email',
              onChanged: (value) {}, // Will be implemented with state management
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              label: 'Password',
              obscureText: true,
              onChanged: (value) {}, // Will be implemented with state management
            ),
            const SizedBox(height: 24),
            if (authViewModel.isLoading)
              const CircularProgressIndicator()
            else
              CustomButton(
                text: 'Login',
                onPressed: () {
                  // Will implement login logic with form state
                },
              ),
            const SizedBox(height: 16),
            if (authViewModel.errorMessage != null)
              Text(
                authViewModel.errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                // Navigate to register screen
              },
              child: const Text('Don\'t have an account? Register'),
            ),
          ],
        ),
      ),
    );
  }
}