import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/dependency_injection.dart';
import 'ui/features/auth/views/login_view.dart';
import 'ui/features/auth/views/register_view.dart';
import 'ui/features/delivery_request/views/available_requests_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  setupLocator();
  runApp(const Sovr1nApp());
}

class Sovr1nApp extends StatelessWidget {
  const Sovr1nApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ViewModels will be provided by GetIt via Provider
        ProxyProvider<AuthViewModel, DeliveryRequestViewModel>(
          update: (context, authViewModel, previous) => locator<DeliveryRequestViewModel>(),
        ),
      ],
      child: MaterialApp(
        title: 'Sovr1n Delivery',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        home: const AppRouter(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    // In a real app, this would check auth state
    // For demo purposes, we'll show login
    return const LoginView();
  }
}