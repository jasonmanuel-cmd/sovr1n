import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/auth_view_model.dart';
import '../../core/widgets/custom_text_field.dart';
import '../../core/widgets/custom_button.dart';

class RegisterView extends StatelessWidget {
  const RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    final authViewModel = Provider.of<AuthViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CustomTextField(
                label: 'Name',
                onChanged: (value) {}, // Will be implemented with state management
              ),
              const SizedBox(height: 16),
              CustomTextField(
                label: 'Email',
                onChanged: (value) {}, // Will be implemented with state management
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                label: 'Phone Number',
                onChanged: (value) {}, // Will be implemented with state management
                keyboardType: TextInputType.phone,
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
                  text: 'Register',
                  onPressed: () {
                    // Will implement register logic with form state
                  },
                ),
              const SizedBox(height: 16),
              if (authViewModel.errorMessage != null)
                Text(
                  authViewModel.errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
            ],
          ),
        ),
      ),
    );
  }
}