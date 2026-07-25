import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../domain/models/delivery_request.dart';
import '../view_models/delivery_request_view_model.dart';
import '../../core/widgets/custom_button.dart';

class LocationTrackingView extends StatelessWidget {
  final String requestId;

  const LocationTrackingView({super.key, required this.requestId});

  @override
  Widget build(BuildContext context) {
    final deliveryRequestViewModel = Provider.of<DeliveryRequestViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tracking Delivery'),
        actions: [
          IconButton(
            icon: Icon(deliveryRequestViewModel.isTrackingLocation 
                ? Icons.stop 
                : Icons.play_arrow),
            onPressed: () {
              if (deliveryRequestViewModel.isTrackingLocation) {
                deliveryRequestViewModel.stopTrackingLocation();
              } else {
                deliveryRequestViewModel.startTrackingLocation(requestId);
              }
            },
          ),
        ],
      ),
      body: deliveryRequestViewModel.selectedRequest == null
          ? const Center(child: Text('Loading delivery details...'))
          : Column(
              children: [
                Expanded(
                  child: _buildMapView(
                      context, deliveryRequestViewModel.selectedRequest!),
                ),
                const Divider(height: 1),
                _buildInfoPanel(
                    context, deliveryRequestViewModel.selectedRequest!),
              ],
            ),
      floatingActionButton: deliveryRequestViewModel.selectedRequest?.status ==
              DeliveryStatus.inProgress
          ? FloatingActionButton.extended(
              onPressed: () {
                // Complete the delivery
                deliveryRequestViewModel
                    .completeDeliveryRequest(requestId);
              },
              label: const Text('Complete Delivery'),
              icon: const Icon(Icons.check),
            )
          : null,
    );
  }

  Widget _buildMapView(BuildContext context, DeliveryRequest request) {
    // In a real app, this would use Google Maps or Mapbox
    // For now, we'll show a placeholder with location info
    return Container(
      color: Colors.grey[200],
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.map, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'Map View',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            if (request.currentDriverLatitude != null &&
                request.currentDriverLongitude != null) ...[
              Text(
                'Driver Location:',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Text(
                '${request.currentDriverLatitude!.toStringAsFixed(6)}, ${request.currentDriverLongitude!.toStringAsFixed(6)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (request.lastLocationUpdate != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Last updated: ${_formatTimeAgo(request.lastLocationUpdate!)}',
                  style: Theme.of(context).textTheme.bodySmall
                      .copyWith(color: Colors.grey[600]),
                ),
              ],
            ] else ...[
              const Text(
                'Waiting for driver location...',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoPanel(
      BuildContext context, DeliveryRequest request) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Delivery Details',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          InfoRow(
            label: 'Item:',
            value: request.itemDescription,
          ),
          const SizedBox(height: 8),
          InfoRow(
            label: 'From:',
            value: request.pickupAddress,
          ),
          const SizedBox(height: 8),
          InfoRow(
            label: 'To:',
            value: request.dropoffAddress,
          ),
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),
          Text(
            'Progress',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          InfoRow(
            label: 'Status:',
            value: _getStatusText(request.status),
            valueStyle: TextStyle(
              fontWeight: FontWeight.bold,
              color: _getStatusColor(request.status),
            ),
          ),
          if (request.driverPricePerLoad != null &&
              request.userOfferPrice != null) ...[
            const SizedBox(height: 8),
            InfoRow(
              label: 'Agreed Price:',
              value: '\$${request.driverPricePerLoad!.toStringAsFixed(2)}',
            ),
          ],
        ],
      ),
    );
  }

  String _getStatusText(DeliveryStatus status) {
    switch (status) {
      case DeliveryStatus.pending:
        return 'Pending';
      case DeliveryStatus.assigned:
        return 'Assigned to Driver';
      case DeliveryStatus.inProgress:
        return 'In Progress';
      case DeliveryStatus.completed:
        return 'Completed';
      case DeliveryStatus.cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  Color _getStatusColor(DeliveryStatus status) {
    switch (status) {
      case DeliveryStatus.pending:
        return Colors.orange;
      case DeliveryStatus.assigned:
        return Colors.blue;
      case DeliveryStatus.inProgress:
        return Colors.green;
      case DeliveryStatus.completed:
        return Colors.green[700]!;
      case DeliveryStatus.cancelled:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatTimeAgo(DateTime date) {
    final difference = DateTime.now().difference(date);
    if (difference.inSeconds < 60) {
      return '${difference.inSeconds}s ago';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}

class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final TextStyle? labelStyle;
  final TextStyle? valueStyle;

  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.labelStyle,
    this.valueStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: labelStyle),
        Text(value, style: valueStyle),
      ],
    );
  }
}