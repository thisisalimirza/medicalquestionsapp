import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Thin haptics wrapper. Web has no haptics; guard so calls are no-ops there.
 * Every capture and sort should feel physical — this is core to "fun & rapid".
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  tap: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  bump: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  select: () => enabled && Haptics.selectionAsync(),
};
