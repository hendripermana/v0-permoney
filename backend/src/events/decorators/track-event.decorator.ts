import { SetMetadata } from '@nestjs/common';
import { EventType } from '../types/event.types';

export const TRACK_EVENT_KEY = 'track_event';

export interface TrackEventOptions {
  eventType: EventType | string;
  resourceType?: string;
  extractResourceId?: (args: any[], result?: any) => string | undefined;
  extractEventData?: (args: any[], result?: any) => Record<string, any>;
  trackOnError?: boolean;
}

/**
 * Decorator to automatically track events for controller methods
 */
export const TrackEvent = (options: TrackEventOptions) => 
  SetMetadata(TRACK_EVENT_KEY, options);
