import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../domain/models/rating.dart';
import '../view_models/delivery_request_view_model.dart';
import '../../core/widgets/custom_text_field.dart';
import '../../core/widgets/custom_button.dart';

class RatingView extends StatelessWidget {
  final String deliveryRequestId;
  final String revieweeId; // The user being rated
  final RatingType ratingType; // Who is being rated

  const RatingView({
    super.key,
    required this.deliveryRequestId,
    required this.revieweeId,
    required this.ratingType,
  });

  @override
  Widget build(BuildContext context) {
    final deliveryRequestViewModel = Provider.of<DeliveryRequestViewModel>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(ratingType == RatingType.customerRatingDriver
            ? 'Rate the Driver'
            : 'Rate the Customer'),
      ),
      body: deliveryRequestViewModel.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How was your experience?',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 24),
                  _buildRatingStars(context),
                  const SizedBox(height: 24),
                  Text(
                    'Add a comment (optional)',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  CustomTextField(
                    label: 'Comment',
                    maxLines: 4,
                    onChanged: (value) {},
                  ),
                  const SizedBox(height: 24),
                  if (deliveryRequestViewModel.isLoading)
                    const Center(child: CircularProgressIndicator())
                  else
                    CustomButton(
                      text: 'Submit Rating',
                      onPressed: () {
                        // TODO: Implement rating submission
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildRatingStars(BuildContext context) {
    // In a real implementation, this would be a stateful widget
    // For now, we'll show a simple row of stars
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        return IconButton(
          icon: Icon(
            Icons.star,
            color: Colors.amber[700],
            size: 32,
          ),
          onPressed: () {
            // TODO: Handle star selection
          },
        );
      }),
    );
  }
}