import 'package:flutter_test/flutter_test.dart';
import 'package:sovr1n_delivery/core/dependency_injection.dart';

void main() {
  test('Dependency injection can be initialized', () {
    expect(() => setupLocator(), returnsNormally);
  });
}