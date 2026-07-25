import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/delivery_request_view_model.dart';
import '../../../domain/models/delivery_request.dart';

class PriceNegotiationView extends StatelessWidget {
  final DeliveryRequest request;
  final bool isDriver; // true if current user is driver, false if customer

  const PriceNegotiationView({
    super.key,
    required this.request,
    required this.isDriver,
  });

  @override
  Widget build(BuildContext context) {
    final deliveryRequestViewModel = Provider.of<DeliveryRequestViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(isDriver ? 'Set Your Price' : 'Make an Offer'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Item: ${request.itemDescription}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'From: ${request.pickupAddress}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'To: ${request.dropoffAddress}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            if (isDriver) ...[
              Text(
                'Customer Offer: \$${request.userOfferPrice?.toStringAsFixed(2) ?? 'Not set'}',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              Text(
                'Set your price per load:',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Price per load (\$)',
                  border: OutlineInputBorder(),
                  prefixText: '\$ ',
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                onChanged: (value) {},
              ),
              const SizedBox(height: 24),
              if (deliveryRequestViewModel.isLoading)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton(
                  onPressed: () {
                    // TODO: Implement price setting logic
                  },
                  child: const Text('Submit Price'),
                ),
            ] else ...[
              Text(
                'Set your offer price:',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Your offer (\$)',
                  border: OutlineInputBorder(),
                  prefixText: '\$ ',
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                onChanged: (value) {},
              ),
              const SizedBox(height: 24),
              if (deliveryRequestViewModel.isLoading)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton(
                  onPressed: () {
                    // TODO: Implement offer setting logic
                  },
                  child: const Text('Submit Offer'),
                ),
            ],
            const SizedBox(height: 24),
            if (request.driverPricePerLoad != null &&
                request.userOfferPrice != null) ...[
              Text(
                'Negotiation Status:',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (request.driverPricePerLoad! <= request.userOfferPrice!) ...[
                Text(
                  'Deal can be made!',
                  style: TextStyle(
                    color: Colors.green[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ] else ...[
                Text(
                  'Price gap: \$${(request.driverPricePerLoad! - request.userOfferPrice!).toStringAsFixed(2)}',
                  style: TextStyle(
                    color: Colors.orange[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}