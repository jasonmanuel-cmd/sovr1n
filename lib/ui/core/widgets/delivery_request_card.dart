import 'package:flutter/material.dart';
import '../../../domain/models/delivery_request.dart';

class DeliveryRequestCard extends StatelessWidget {
  final DeliveryRequest request;
  final VoidCallback onAccept;
  final VoidCallback? onPriceNegotiation;

  const DeliveryRequestCard({
    super.key,
    required this.request,
    required this.onAccept,
    this.onPriceNegotiation,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    request.itemDescription,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (request.userOfferPrice != null)
                  Chip(
                    label: Text('\$${request.userOfferPrice!.toStringAsFixed(2)}'),
                    backgroundColor: Colors.green[100],
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    '${request.pickupAddress} → ${request.dropoffAddress}',
                    style: Theme.of(context).textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Weight: ${request.weightKg}kg',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  'Volume: ${request.dimensionsCubicMeters}m³',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (onPriceNegotiation != null)
                  TextButton.icon(
                    onPressed: onPriceNegotiation,
                    icon: const Icon(Icons.attach_money),
                    label: const Text('Negotiate Price'),
                  ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: onAccept,
                  child: const Text('Accept'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}