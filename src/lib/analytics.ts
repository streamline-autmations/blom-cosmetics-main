// Advanced E-commerce Analytics Tracking with Conversion Optimization
// Comprehensive tracking for BLOM Cosmetics

interface AnalyticsConfig {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  hotjarId?: string;
  enableDebug?: boolean;
  enableConversionOptimization?: boolean;
  enableHeatmaps?: boolean;
  enableAbtTesting?: boolean;
}

interface ConversionGoal {
  id: string;
  name: string;
  value: number;
  category: 'purchase' | 'lead' | 'engagement' | 'retention';
  priority: 'high' | 'medium' | 'low';
}

interface UserJourneyStep {
  step: string;
  action: string;
  timestamp: number;
  value?: number;
  properties?: Record<string, any>;
}

interface ABTTestVariant {
  id: string;
  name: string;
  traffic_percentage: number;
  conversion_rate: number;
  variant_data: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  brand?: string;
  variant?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface EcommerceEvent {
  event_name: string;
  event_timestamp?: number;
  user_properties?: Record<string, any>;
  items?: CartItem[];
  value?: number;
  currency?: string;
  page_location?: string;
  page_referrer?: string;
  user_id?: string;
}

class AdvancedAnalytics {
  private config: AnalyticsConfig;
  private debugMode: boolean;
  private userJourney: UserJourneyStep[] = [];
  private sessionId: string;
  private conversionGoals: ConversionGoal[] = [
    {
      id: 'purchase',
      name: 'Purchase Completion',
      value: 1,
      category: 'purchase',
      priority: 'high'
    },
    {
      id: 'add_to_cart',
      name: 'Add to Cart',
      value: 0.3,
      category: 'engagement',
      priority: 'medium'
    },
    {
      id: 'email_signup',
      name: 'Email Signup',
      value: 0.5,
      category: 'lead',
      priority: 'medium'
    },
    {
      id: 'wishlist_add',
      name: 'Add to Wishlist',
      value: 0.2,
      category: 'engagement',
      priority: 'low'
    }
  ];

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      googleAnalyticsId: config.googleAnalyticsId || 'G-XXXXXXXXXX', // Placeholder - remove analytics for now
      facebookPixelId: config.facebookPixelId || 'YOUR_FACEBOOK_PIXEL_ID',
      hotjarId: config.hotjarId || undefined,
      enableDebug: config.enableDebug || false,
      enableConversionOptimization: config.enableConversionOptimization || true,
      enableHeatmaps: config.enableHeatmaps || true,
      enableAbtTesting: config.enableAbtTesting || true,
      ...config
    };
    this.debugMode = this.config.enableDebug || false;
    this.sessionId = this.generateSessionId();
    this.initializeUserJourney();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeUserJourney() {
    // Track session start
    this.trackUserJourney('session_start', 'session_start', Date.now());
    
    // Initialize user type (new vs returning)
    const isReturningUser = localStorage.getItem('blom_returning_user');
    if (isReturningUser) {
      this.setUserProperties({ user_type: 'returning' });
    } else {
      localStorage.setItem('blom_returning_user', 'true');
      this.setUserProperties({ user_type: 'new' });
    }
  }

  // Enhanced User Journey Tracking
  trackUserJourney(step: string, action: string, timestamp: number, value?: number, properties?: Record<string, any>) {
    const journeyStep: UserJourneyStep = {
      step,
      action,
      timestamp,
      value,
      properties
    };

    this.userJourney.push(journeyStep);

    // Track in GA4 as a custom event
    this.trackEvent('user_journey_step', {
      step_name: step,
      action_taken: action,
      journey_position: this.userJourney.length,
      timestamp: new Date(timestamp).toISOString(),
      value: value || 0,
      session_id: this.sessionId,
      ...properties
    });

    this.log('User journey step tracked', journeyStep);
  }

  // Advanced Conversion Goal Tracking
  trackConversionGoal(goalId: string, value?: number, properties?: Record<string, any>) {
    const goal = this.conversionGoals.find(g => g.id === goalId);
    if (!goal) {
      this.log('Unknown conversion goal', { goalId });
      return;
    }

    const conversionValue = value || goal.value;
    
    // Track as GA4 event
    this.trackEvent('conversion_goal', {
      goal_id: goalId,
      goal_name: goal.name,
      goal_category: goal.category,
      goal_priority: goal.priority,
      conversion_value: conversionValue,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      ...properties
    });

    // Track as enhanced ecommerce conversion
    if (goal.category === 'purchase') {
      this.trackEvent('purchase', {
        transaction_id: 'conversion_' + Date.now(),
        affiliation: 'BLOM Cosmetics Online',
        currency: 'ZAR',
        value: conversionValue,
        conversion_source: 'goal_tracking'
      });
    }

    this.log('Conversion goal tracked', { goalId, conversionValue, goal });
  }

  // Customer Lifetime Value Tracking
  trackCustomerLifetimeValue(customerId: string, orderValue: number, frequency: number) {
    const clv = this.calculateCLV(orderValue, frequency);
    
    this.trackEvent('customer_lifetime_value', {
      customer_id: customerId,
      order_value: orderValue,
      order_frequency: frequency,
      calculated_clv: clv,
      clv_tier: this.getCLVTier(clv),
      session_id: this.sessionId
    });

    this.setUserProperties({
      customer_lifetime_value: clv,
      customer_segment: this.getCLVTier(clv)
    });

    this.log('Customer LTV tracked', { customerId, clv, tier: this.getCLVTier(clv) });
  }

  private calculateCLV(orderValue: number, frequency: number): number {
    // Simple CLV calculation: Order Value × Frequency × 12 (months)
    return orderValue * frequency * 12;
  }

  private getCLVTier(clv: number): string {
    if (clv >= 5000) return 'high_value';
    if (clv >= 2000) return 'medium_value';
    if (clv >= 500) return 'low_value';
    return 'prospect';
  }

  // Helper Methods for Enhanced Analytics
  private getJourneyStage(): string {
    const stages: { [key: number]: string } = {
      1: 'awareness',
      2: 'consideration', 
      3: 'evaluation',
      4: 'purchase',
      5: 'post_purchase'
    };
    
    const stageIndex = Math.min(this.userJourney.length, 5);
    return stages[stageIndex] || 'awareness';
  }

  private calculateEngagementScore(): number {
    // Simple engagement score based on time on site and actions
    const timeOnSite = Date.now() - parseInt(this.sessionId.split('_')[1] || Date.now().toString());
    const actionCount = this.userJourney.length;
    
    // Score based on time (normalized) and actions
    const timeScore = Math.min(timeOnSite / 30000, 5); // Max 5 points for time (30s+)
    const actionScore = Math.min(actionCount * 0.5, 5); // Max 5 points for actions
    
    return Math.round(timeScore + actionScore);
  }

  // Enhanced Add to Cart with Conversion Tracking
  addToCart(items: CartItem[], value?: number, options?: { source?: string; trigger?: string }) {
    const cartValue = value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const formattedItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand || 'BLOM Cosmetics',
      item_variant: item.variant,
      price: item.price,
      quantity: item.quantity,
      currency: 'ZAR'
    }));

    this.trackEvent('add_to_cart', {
      currency: 'ZAR',
      value: cartValue,
      items: formattedItems,
      source: options?.source || 'direct',
      trigger: options?.trigger || 'unknown',
      user_journey_stage: this.getJourneyStage(),
      engagement_score: this.calculateEngagementScore()
    });

    // Track conversion goal
    this.trackConversionGoal('add_to_cart', cartValue, {
      items_count: items.length,
      cart_value: cartValue,
      source: options?.source || 'direct'
    });

    this.trackFacebookEvent('AddToCart', {
      content_type: 'product',
      content_ids: items.map(item => item.id),
      content_names: items.map(item => item.name),
      value: cartValue,
      currency: 'ZAR'
    });

    // Track user journey step
    this.trackUserJourney('add_to_cart', 'add_to_cart', Date.now(), cartValue, {
      items_count: items.length,
      cart_value: cartValue,
      source: options?.source || 'direct'
    });

    this.log('Added to cart', { items, value: cartValue });
  }

  // Enhanced Purchase with Advanced Tracking
  purchase(transactionId: string, items: CartItem[], value: number, tax: number, shipping: number, options?: { source?: string; method?: string }) {
    const formattedItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      currency: 'ZAR'
    }));

    this.trackEvent('purchase', {
      transaction_id: transactionId,
      affiliation: 'BLOM Cosmetics Online',
      currency: 'ZAR',
      value: value,
      tax: tax,
      shipping: shipping,
      items: formattedItems,
      payment_method: options?.method || 'unknown',
      source: options?.source || 'direct',
      user_journey_stage: this.getJourneyStage(),
      conversion_funnel_stage: 'completed'
    });

    // Track conversion goal
    this.trackConversionGoal('purchase', value, {
      transaction_id: transactionId,
      items_count: items.length,
      payment_method: options?.method || 'unknown',
      source: options?.source || 'direct'
    });

    this.trackFacebookEvent('Purchase', {
      content_type: 'product',
      content_ids: items.map(item => item.id),
      value: value,
      currency: 'ZAR',
      tax: tax,
      shipping: shipping
    });

    // Track customer lifetime value if user ID available
    const userId = localStorage.getItem('blom_user_id');
    if (userId) {
      this.trackCustomerLifetimeValue(userId, value, 1);
    }

    // Track user journey completion
    this.trackUserJourney('purchase', 'purchase_complete', Date.now(), value, {
      transaction_id: transactionId,
      items_count: items.length,
      payment_method: options?.method || 'unknown'
    });

    this.log('Purchase completed', { transactionId, value, items });
  }

  // Debug logging
  private log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[Analytics] ${message}`, data || '');
    }
  }

  // Google Analytics 4 Enhanced E-commerce
  trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      this.log(`GA4 Event: ${eventName}`, parameters);
      (window as any).gtag('event', eventName, {
        ...parameters,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Facebook Pixel Events
  trackFacebookEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      this.log(`FB Pixel Event: ${eventName}`, parameters);
      (window as any).fbq('track', eventName, parameters);
    }
  }

  // Enhanced E-commerce Events

  // View Item
  viewItem(product: Product, options?: { source?: string; context?: string }) {
    const item = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_brand: product.brand || 'BLOM Cosmetics',
      item_variant: product.variant,
      price: product.price,
      currency: 'ZAR'
    };

    this.trackEvent('view_item', { 
      items: [item],
      source: options?.source || 'direct',
      context: options?.context || 'unknown',
      user_journey_stage: this.getJourneyStage()
    });

    // Track product view for personalization
    this.trackEvent('product_view', {
      product_id: product.id,
      product_name: product.name,
      product_category: product.category,
      view_source: options?.source || 'direct',
      engagement_score: this.calculateEngagementScore(),
      session_id: this.sessionId
    });

    this.trackFacebookEvent('ViewContent', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: 'ZAR'
    });

    // Track user journey step
    this.trackUserJourney('product_view', 'view_item', Date.now(), 0.1, {
      product_id: product.id,
      product_name: product.name,
      category: product.category
    });

    this.log('Product viewed', item);
  }

  // View Item List
  viewItemList(category: string, items: Product[]) {
    const formattedItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: category,
      item_brand: item.brand || 'BLOM Cosmetics',
      price: item.price,
      currency: 'ZAR'
    }));

    this.trackEvent('view_item_list', {
      item_list_name: category,
      items: formattedItems
    });

    this.log('Item list viewed', { category, count: items.length });
  }

  // Remove from Cart
  removeFromCart(items: CartItem[], value?: number) {
    const cartValue = value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const formattedItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      currency: 'ZAR'
    }));

    this.trackEvent('remove_from_cart', {
      currency: 'ZAR',
      value: cartValue,
      items: formattedItems
    });

    this.log('Removed from cart', { items, value: cartValue });
  }

  // Begin Checkout
  beginCheckout(items: CartItem[], value: number) {
    const formattedItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      currency: 'ZAR'
    }));

    this.trackEvent('begin_checkout', {
      currency: 'ZAR',
      value: value,
      items: formattedItems
    });

    this.trackFacebookEvent('InitiateCheckout', {
      content_type: 'product',
      content_ids: items.map(item => item.id),
      value: value,
      currency: 'ZAR'
    });

    this.log('Checkout initiated', { items, value });
  }

  // Add Payment Info
  addPaymentInfo(paymentType: string, value: number) {
    this.trackEvent('add_payment_info', {
      payment_type: paymentType,
      currency: 'ZAR',
      value: value
    });

    this.log('Payment info added', { paymentType, value });
  }

  // Search
  search(searchTerm: string, resultsCount: number) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });

    this.trackFacebookEvent('Search', {
      search_string: searchTerm,
      content_type: 'product'
    });

    this.log('Search performed', { searchTerm, resultsCount });
  }

  // Course/Service Tracking
  viewCourse(courseName: string, coursePrice: number) {
    this.trackEvent('view_course', {
      course_name: courseName,
      course_price: coursePrice,
      currency: 'ZAR'
    });

    this.trackFacebookEvent('ViewContent', {
      content_type: 'course',
      content_name: courseName,
      value: coursePrice,
      currency: 'ZAR'
    });
  }

  // Lead Generation
  generateLead(source: string, formName: string, value?: number) {
    this.trackEvent('generate_lead', {
      lead_source: source,
      form_name: formName,
      currency: 'ZAR',
      value: value || 0
    });

    this.trackFacebookEvent('Lead', {
      content_name: formName,
      content_category: source,
      value: value || 0
    });

    this.log('Lead generated', { source, formName, value });
  }

  // User Engagement
  shareContent(contentType: string, itemId: string, method: string) {
    this.trackEvent('share', {
      content_type: contentType,
      item_id: itemId,
      method: method
    });

    this.trackFacebookEvent('Share', {
      content_type: contentType,
      content_id: itemId
    });
  }

  // Page Performance
  trackPagePerformance(pageName: string, loadTime: number) {
    this.trackEvent('page_performance', {
      page_name: pageName,
      load_time: loadTime
    });
  }

  // Custom Events
  customEvent(eventName: string, parameters: Record<string, any>) {
    this.trackEvent(eventName, parameters);
    this.log(`Custom event: ${eventName}`, parameters);
  }

  // Error Tracking
  trackError(errorType: string, errorMessage: string, page?: string) {
    this.trackEvent('exception', {
      description: errorMessage,
      fatal: false,
      page: page || window.location.pathname
    });

    this.log('Error tracked', { errorType, errorMessage, page });
  }

  // User Properties
  setUserProperties(properties: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.config.googleAnalyticsId, {
        user_properties: properties
      });
      this.log('User properties set', properties);
    }
  }

  // Enhanced User Tracking
  trackUserEngagement(action: string, duration?: number, pageName?: string) {
    this.trackEvent('user_engagement', {
      engagement_time_msec: duration || 1000,
      page_name: pageName || window.location.pathname,
      action: action
    });
  }

  // Scroll Depth Tracking
  trackScrollDepth(percentScrolled: number, pageName: string) {
    this.trackEvent('scroll', {
      percent_scrolled: percentScrolled,
      page_name: pageName
    });
  }

  // Video Engagement
  trackVideoProgress(videoId: string, progress: number, duration: number) {
    this.trackEvent('video_progress', {
      video_id: videoId,
      video_progress: progress,
      video_duration: duration
    });
  }

  // Newsletter Subscription
  subscribeNewsletter(email: string, source: string) {
    this.trackEvent('sign_up', {
      method: 'email',
      newsletter_source: source
    });

    this.trackFacebookEvent('CompleteRegistration', {
      content_name: 'newsletter',
      value: 1
    });

    this.log('Newsletter subscription', { email, source });
  }

  // Contact/Support
  contactSupport(method: string, topic?: string) {
    this.trackEvent('contact', {
      contact_method: method,
      contact_topic: topic || 'general'
    });

    this.log('Contact support', { method, topic });
  }
}

// Singleton instance
let analyticsInstance: AdvancedAnalytics | null = null;

export const getAnalytics = (config?: AnalyticsConfig): AdvancedAnalytics => {
  if (!analyticsInstance) {
    analyticsInstance = new AdvancedAnalytics(config);
  }
  return analyticsInstance;
};

// Default export with standard configuration
export const analytics = getAnalytics();

// Type exports
export type { AnalyticsConfig, Product, CartItem, EcommerceEvent };
