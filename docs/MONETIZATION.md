# Complete Monetization Architecture: Ads + Subscription Payments

## Monetization Strategy Overview

**Free Tier (Ad-Supported)**
- 3 trees maximum
- Basic AI analysis
- Standard recommendations
- Banner + interstitial ads
- Community features

**Premium Tiers (Ad-Free)**
- **Hobbyist ($4.99/month)**: 10 trees, advanced analysis, priority support
- **Arborist ($14.99/month)**: Unlimited trees, expert consultations, weather API
- **Professional ($29.99/month)**: Multi-property management, team sharing, analytics

## Ad Integration Architecture

### 1. Ad Network Selection & Integration

#### Primary: Google AdMob (Best Revenue + Targeting)
```javascript
// React Native AdMob setup
npm install react-native-google-mobile-ads

// AdService.js
import {
  BannerAd,
  InterstitialAd,
  RewardedAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

class AdService {
  constructor() {
    this.interstitialAd = InterstitialAd.createForAdRequest(
      __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxx/xxx'
    );

    this.rewardedAd = RewardedAd.createForAdRequest(
      __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxx/xxx'
    );
  }

  // Strategic ad placement
  showInterstitialAfterAnalysis() {
    // Only show after successful tree analysis
    if (this.interstitialAd.loaded) {
      this.interstitialAd.show();
    }
  }

  showRewardedForExtraAnalysis() {
    // Offer free premium analysis for watching ad
    return new Promise((resolve) => {
      this.rewardedAd.addAdEventListener('rewarded', () => {
        resolve(true); // Grant premium feature temporarily
      });
      this.rewardedAd.show();
    });
  }
}
```

#### Secondary: Amazon DSP (Stay in AWS Ecosystem)
```javascript
// Amazon Publisher Services integration
import { AmazonPublisherServices } from '@amazon-dsp/react-native';

class AmazonAdService {
  async initializeAPS() {
    await AmazonPublisherServices.initialize({
      appId: 'your-amazon-app-id',
      enableTesting: __DEV__
    });
  }

  async loadBannerAd(slotId) {
    const adRequest = await AmazonPublisherServices.createBannerAdRequest({
      slotId: slotId,
      width: 320,
      height: 50
    });
    return adRequest;
  }
}
```

### 2. Strategic Ad Placement for Tree Care App

#### UX-Optimized Ad Locations
```javascript
// AdPlacementStrategy.js
const AD_PLACEMENTS = {
  // Non-intrusive banner ads
  HOME_SCREEN: {
    type: 'banner',
    position: 'bottom',
    timing: 'always',
    revenue: 'low',
    userImpact: 'minimal'
  },

  // Interstitial at natural break points
  AFTER_PHOTO_ANALYSIS: {
    type: 'interstitial',
    timing: 'after_successful_analysis',
    frequency: 'every_3rd_analysis',
    revenue: 'high',
    userImpact: 'medium'
  },

  // Rewarded ads for premium features
  PREMIUM_FEATURE_GATE: {
    type: 'rewarded',
    trigger: 'accessing_premium_analysis',
    reward: 'temporary_premium_access',
    revenue: 'highest',
    userImpact: 'positive' // User gets value
  },

  // Native ads in recommendation list
  RECOMMENDATIONS_FEED: {
    type: 'native',
    position: 'between_recommendations',
    frequency: 'every_5th_item',
    revenue: 'medium',
    userImpact: 'low'
  }
};

class SmartAdManager {
  constructor(userTier, usagePattern) {
    this.userTier = userTier;
    this.usagePattern = usagePattern;
    this.adFrequency = this.calculateOptimalFrequency();
  }

  calculateOptimalFrequency() {
    // Reduce ad frequency for engaged users to prevent churn
    const engagementScore = this.usagePattern.photosPerWeek * 2 +
                           this.usagePattern.appOpensPerWeek;

    if (engagementScore > 15) return 'low';
    if (engagementScore > 8) return 'medium';
    return 'high';
  }

  shouldShowAd(placement, context) {
    if (this.userTier !== 'free') return false;

    const rules = AD_PLACEMENTS[placement];
    const userSession = context.userSession;

    // Respect user experience
    if (userSession.adsShownThisSession > 3) return false;
    if (userSession.lastAdShown < 60000) return false; // 1 min cooldown

    return this.checkFrequencyRules(rules, context);
  }
}
```

### 3. AWS Backend for Ad Management

#### Lambda Function for Ad Decision Engine
```python
# ad_decision_engine.py
import boto3
import json
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    user_id = event['userId']
    placement = event['placement']

    # Get user data from DynamoDB
    users_table = dynamodb.Table('Users')
    user_data = users_table.get_item(Key={'userId': user_id})

    if user_data['Item']['subscriptionTier'] != 'free':
        return {'showAd': False}

    # Check ad frequency limits
    ad_history = get_user_ad_history(user_id)

    decision = make_ad_decision(user_data['Item'], ad_history, placement)

    # Log for analytics
    if decision['showAd']:
        log_ad_impression(user_id, placement, decision['adType'])

    return decision

def make_ad_decision(user_profile, ad_history, placement):
    # Smart frequency capping
    recent_ads = [ad for ad in ad_history
                  if ad['timestamp'] > datetime.now() - timedelta(hours=1)]

    if len(recent_ads) >= 3:  # Max 3 ads per hour
        return {'showAd': False}

    # Higher value users see fewer ads
    engagement_score = calculate_engagement(user_profile)
    if engagement_score > 80 and len(recent_ads) >= 1:
        return {'showAd': False}

    # Determine ad type based on placement and user behavior
    ad_type = select_optimal_ad_type(placement, user_profile)

    return {
        'showAd': True,
        'adType': ad_type,
        'placement': placement,
        'targeting': get_targeting_keywords(user_profile)
    }

def get_targeting_keywords(user_profile):
    """Generate targeting keywords for better ad relevance"""
    keywords = ['gardening', 'landscaping', 'outdoor']

    # Add based on user's trees
    tree_species = [tree['species'] for tree in user_profile.get('trees', [])]
    if 'oak' in tree_species:
        keywords.extend(['oak trees', 'shade trees'])
    if 'fruit' in tree_species:
        keywords.extend(['fruit trees', 'orchard'])

    # Add location-based keywords
    location = user_profile.get('location', {})
    if location.get('climate_zone'):
        keywords.append(f"zone {location['climate_zone']} plants")

    return keywords
```

## Payment Processing Architecture

### 1. Stripe Integration with AWS

#### Subscription Management Backend
```python
# subscription_service.py
import stripe
import boto3
import json
from datetime import datetime

stripe.api_key = os.environ['STRIPE_SECRET_KEY']
dynamodb = boto3.resource('dynamodb')

def create_subscription(event, context):
    """Handle subscription creation from mobile app"""

    user_id = event['userId']
    price_id = event['priceId']  # Stripe price ID
    payment_method = event['paymentMethodId']

    try:
        # Create or retrieve Stripe customer
        customer = get_or_create_stripe_customer(user_id)

        # Attach payment method
        stripe.PaymentMethod.attach(
            payment_method,
            customer=customer.id
        )

        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{'price': price_id}],
            default_payment_method=payment_method,
            metadata={'userId': user_id}
        )

        # Update user in DynamoDB
        update_user_subscription(user_id, subscription)

        # Remove ads immediately
        revoke_ad_targeting(user_id)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'subscriptionId': subscription.id,
                'status': subscription.status,
                'currentPeriodEnd': subscription.current_period_end
            })
        }

    except stripe.error.CardError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }

def handle_stripe_webhook(event, context):
    """Process Stripe webhooks for subscription events"""

    payload = event['body']
    sig_header = event['headers']['stripe-signature']
    endpoint_secret = os.environ['STRIPE_WEBHOOK_SECRET']

    try:
        webhook_event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return {'statusCode': 400}
    except stripe.error.SignatureVerificationError:
        return {'statusCode': 400}

    # Handle different webhook events
    if webhook_event['type'] == 'customer.subscription.updated':
        handle_subscription_updated(webhook_event['data']['object'])
    elif webhook_event['type'] == 'customer.subscription.deleted':
        handle_subscription_cancelled(webhook_event['data']['object'])
    elif webhook_event['type'] == 'invoice.payment_failed':
        handle_payment_failed(webhook_event['data']['object'])

    return {'statusCode': 200}

def handle_subscription_cancelled(subscription):
    """Revert user to free tier when subscription cancelled"""
    user_id = subscription['metadata']['userId']

    # Update user tier in DynamoDB
    users_table = dynamodb.Table('Users')
    users_table.update_item(
        Key={'userId': user_id},
        UpdateExpression='SET subscriptionTier = :tier, subscriptionStatus = :status',
        ExpressionAttributeValues={
            ':tier': 'free',
            ':status': 'cancelled'
        }
    )

    # Re-enable ads
    enable_ad_targeting(user_id)

    # Limit tree count if over free limit
    enforce_tree_limits(user_id)

def enforce_tree_limits(user_id):
    """Limit free users to 3 trees"""
    trees_table = dynamodb.Table('Trees')
    user_trees = trees_table.query(
        IndexName='userId-index',
        KeyConditionExpression='userId = :userId',
        ExpressionAttributeValues={':userId': user_id}
    )

    if len(user_trees['Items']) > 3:
        # Mark excess trees as archived
        for tree in user_trees['Items'][3:]:
            trees_table.update_item(
                Key={'treeId': tree['treeId']},
                UpdateExpression='SET archived = :archived',
                ExpressionAttributeValues={':archived': True}
            )
```

#### React Native Payment Integration
```javascript
// PaymentService.js
import {CardField, useStripe} from '@stripe/stripe-react-native';

class PaymentService {
  constructor() {
    this.stripe = useStripe();
  }

  async subscribeToPremium(priceId) {
    try {
      // Create payment intent on backend
      const {clientSecret} = await this.createPaymentIntent(priceId);

      // Confirm payment with Stripe
      const {paymentIntent, error} = await this.stripe.confirmPayment(
        clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Update app state
      await this.updateUserTier('premium');

      // Hide all ads immediately
      AdService.disableAds();

      return {success: true, subscriptionId: paymentIntent.id};

    } catch (error) {
      console.error('Payment failed:', error);
      return {success: false, error: error.message};
    }
  }

  async createPaymentIntent(priceId) {
    const response = await fetch(`${API_ENDPOINT}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify({
        priceId: priceId,
        userId: await this.getCurrentUserId()
      })
    });

    return response.json();
  }
}
```

### 2. Subscription Tier Management

#### DynamoDB Schema Updates
```javascript
// Enhanced Users table for subscription management
const UsersTableSchema = {
  userId: String,
  email: String,
  subscriptionTier: String, // 'free', 'hobbyist', 'arborist', 'professional'
  subscriptionStatus: String, // 'active', 'past_due', 'cancelled'
  stripeCustomerId: String,
  subscriptionId: String,
  currentPeriodEnd: Number, // Unix timestamp
  billing: {
    nextBillingDate: Date,
    amount: Number,
    currency: String,
    paymentMethod: Object
  },
  usage: {
    treesCount: Number,
    photosThisMonth: Number,
    analysisCredits: Number, // For usage-based billing
    adInteractions: {
      impressions: Number,
      clicks: Number,
      revenue: Number
    }
  }
};
```

#### Feature Access Control
```javascript
// FeatureGate.js - Control access based on subscription
class FeatureGate {
  constructor(userTier) {
    this.userTier = userTier;
    this.limits = {
      free: {
        maxTrees: 3,
        maxPhotosPerMonth: 20,
        advancedAnalysis: false,
        weatherIntegration: false,
        expertConsultation: false,
        adsEnabled: true
      },
      hobbyist: {
        maxTrees: 10,
        maxPhotosPerMonth: 100,
        advancedAnalysis: true,
        weatherIntegration: true,
        expertConsultation: false,
        adsEnabled: false
      },
      arborist: {
        maxTrees: -1, // unlimited
        maxPhotosPerMonth: -1,
        advancedAnalysis: true,
        weatherIntegration: true,
        expertConsultation: true,
        adsEnabled: false
      }
    };
  }

  canAddTree(currentTreeCount) {
    const limit = this.limits[this.userTier].maxTrees;
    return limit === -1 || currentTreeCount < limit;
  }

  canUseAdvancedAnalysis() {
    return this.limits[this.userTier].advancedAnalysis;
  }

  shouldShowAds() {
    return this.limits[this.userTier].adsEnabled;
  }
}
```

## Revenue Analytics & Optimization

### 1. CloudWatch Dashboards for Revenue Tracking
```python
# analytics_service.py
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')

def track_ad_revenue(user_id, ad_type, estimated_revenue):
    """Track ad revenue for analytics"""
    cloudwatch.put_metric_data(
        Namespace='TreeCareApp/Revenue',
        MetricData=[
            {
                'MetricName': 'AdRevenue',
                'Dimensions': [
                    {'Name': 'AdType', 'Value': ad_type},
                    {'Name': 'UserTier', 'Value': 'free'}
                ],
                'Value': estimated_revenue,
                'Unit': 'None',
                'Timestamp': datetime.utcnow()
            }
        ]
    )

def track_subscription_metrics(event_type, subscription_tier, revenue=0):
    """Track subscription events"""
    cloudwatch.put_metric_data(
        Namespace='TreeCareApp/Subscriptions',
        MetricData=[
            {
                'MetricName': event_type, # 'NewSubscription', 'Cancellation', 'Upgrade'
                'Dimensions': [
                    {'Name': 'Tier', 'Value': subscription_tier}
                ],
                'Value': 1,
                'Unit': 'Count'
            },
            {
                'MetricName': 'Revenue',
                'Dimensions': [
                    {'Name': 'Tier', 'Value': subscription_tier}
                ],
                'Value': revenue,
                'Unit': 'None'
            }
        ]
    )

def generate_revenue_report():
    """Generate monthly revenue breakdown"""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=30)

    # Get ad revenue
    ad_revenue = cloudwatch.get_metric_statistics(
        Namespace='TreeCareApp/Revenue',
        MetricName='AdRevenue',
        StartTime=start_time,
        EndTime=end_time,
        Period=86400,  # Daily
        Statistics=['Sum']
    )

    # Get subscription revenue
    subscription_revenue = cloudwatch.get_metric_statistics(
        Namespace='TreeCareApp/Subscriptions',
        MetricName='Revenue',
        StartTime=start_time,
        EndTime=end_time,
        Period=86400,
        Statistics=['Sum']
    )

    return {
        'adRevenue': sum(point['Sum'] for point in ad_revenue['Datapoints']),
        'subscriptionRevenue': sum(point['Sum'] for point in subscription_revenue['Datapoints']),
        'totalRevenue': ad_revenue + subscription_revenue
    }
```

### 2. A/B Testing for Revenue Optimization
```python
# ab_testing_service.py
def assign_user_to_test_group(user_id, test_name):
    """Assign users to A/B test groups consistently"""
    import hashlib

    # Create deterministic assignment based on user ID
    hash_input = f"{user_id}_{test_name}".encode()
    hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)

    # Split into groups
    group = 'A' if hash_value % 2 == 0 else 'B'

    # Log assignment
    dynamodb = boto3.resource('dynamodb')
    ab_tests_table = dynamodb.Table('ABTests')
    ab_tests_table.put_item(Item={
        'userId': user_id,
        'testName': test_name,
        'group': group,
        'assignedAt': datetime.utcnow().isoformat()
    })

    return group

# Test different ad frequencies
AD_FREQUENCY_TEST = {
    'groupA': {'max_ads_per_hour': 2, 'interstitial_frequency': 'every_5th'},
    'groupB': {'max_ads_per_hour': 4, 'interstitial_frequency': 'every_3rd'}
}

# Test subscription pricing
PRICING_TEST = {
    'groupA': {'hobbyist_price': 4.99, 'arborist_price': 14.99},
    'groupB': {'hobbyist_price': 6.99, 'arborist_price': 19.99}
}
```

## Development Timeline Integration

### Phase 1: Core Monetization (Month 5)
- **Week 1-2**: Stripe integration and subscription backend
- **Week 3**: AdMob integration with basic banner ads
- **Week 4**: Payment flows and subscription management UI

### Phase 2: Revenue Optimization (Month 6)
- **Week 1**: Smart ad placement and frequency capping
- **Week 2**: A/B testing infrastructure
- **Week 3**: Revenue analytics dashboards
- **Week 4**: Subscription tier feature gates

### Phase 3: Advanced Monetization (Month 7)
- **Week 1**: Rewarded ads for premium features
- **Week 2**: Native ad integration in recommendations
- **Week 3**: Usage-based billing options
- **Week 4**: Revenue optimization based on data

### Additional Dependencies

```json
{
  "stripe": "^12.0.0",
  "react-native-google-mobile-ads": "^12.0.0",
  "@stripe/stripe-react-native": "^0.27.0",
  "react-native-iap": "^12.10.0",
  "react-native-purchase": "^7.0.0"
}
```

### AWS Services Added
- **Stripe Webhooks**: Lambda + API Gateway
- **Revenue Analytics**: CloudWatch custom metrics
- **A/B Testing**: DynamoDB + EventBridge
- **Payment Processing**: Lambda + Secrets Manager
- **Subscription Management**: DynamoDB + SQS

This monetization architecture balances user experience with revenue generation, using smart ad placement and fair subscription pricing to build a sustainable business while keeping users engaged with the core tree care functionality.