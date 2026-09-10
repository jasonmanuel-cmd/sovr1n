import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/delivery_request_view_model.dart';
import '../../core/widgets/custom_button.dart';
import '../../core/widgets/delivery_request_card.dart';
import 'price_negotiation_view.dart';

class AvailableRequestsView extends StatelessWidget {
  const AvailableRequestsView({super.key});

  @override
  Widget build(BuildContext context) {
    final deliveryRequestViewModel = Provider.of<DeliveryRequestViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Available Deliveries')),
      body: deliveryRequestViewModel.isLoading
          ? const Center(child: CircularProgressIndicator())
          : deliveryRequestViewModel.availableRequests.isEmpty
              ? const Center(child: Text('No available deliveries in your area'))
              : ListView.builder(
                  itemCount: deliveryRequestViewModel.availableRequests.length,
                  itemBuilder: (context, index) {
                    final request = deliveryRequestViewModel.availableRequests[index];
                    return DeliveryRequestCard(
                      request: request,
                      onAccept: () => deliveryRequestViewModel.acceptDeliveryRequest(request.id),
                      onPriceNegotiation: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => PriceNegotiationView(
                            request: request,
                            isDriver: true, // In a real app, this would come from auth state
                          ),
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to create delivery request screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}