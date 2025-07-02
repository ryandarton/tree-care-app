import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

export interface CardAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  status?: 'healthy' | 'warning' | 'critical';
  nextAction?: Date;
  location?: string;
  variant?: 'default' | 'compact' | 'featured';
  loading?: boolean;
  onPress?: () => void;
  actions?: CardAction[];
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  image,
  status,
  nextAction,
  location,
  variant = 'default',
  loading = false,
  onPress,
  actions,
  testID,
  accessibilityLabel,
}) => {
  const isInteractive = !!onPress;
  
  const cardStyle: ViewStyle = {
    ...styles.card,
    ...variants[variant],
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getAccessibilityHint = () => {
    const hints = [];
    if (status) hints.push(`Status: ${status}`);
    if (nextAction) hints.push(`Next action: ${formatDate(nextAction)}`);
    if (location) hints.push(`Location: ${location}`);
    return hints.length > 0 ? hints.join(', ') : undefined;
  };

  const renderContent = () => (
    <>
      {image && (
        <Image
          source={{ uri: image }}
          style={styles.image}
          testID="card-image"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          
          {status && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) }
              ]}
              testID="status-badge"
            >
              <Text style={styles.statusText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          )}
        </View>
        
        {children}
        
        <View style={styles.footer}>
          {location && (
            <Text style={styles.location} numberOfLines={1}>
              📍 {location}
            </Text>
          )}
          
          {nextAction && (
            <Text style={styles.nextAction}>
              Next: {formatDate(nextAction)}
            </Text>
          )}
        </View>
        
        {actions && actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  action.variant === 'destructive' && styles.actionButtonDestructive
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.variant === 'destructive' && styles.actionTextDestructive
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            color="#2D5016"
            testID="card-loading"
          />
        </View>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={getAccessibilityHint()}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={getAccessibilityHint()}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 12,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextAction: {
    fontSize: 14,
    color: '#2D5016',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonDestructive: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actionTextDestructive: {
    color: '#DC2626',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const variants: Record<'default' | 'compact' | 'featured', ViewStyle> = {
  default: {
    padding: 0,
  },
  compact: {
    padding: 12,
    shadowOpacity: 0.05,
  },
  featured: {
    borderColor: '#2D5016',
    borderWidth: 2,
    shadowOpacity: 0.15,
  },
};