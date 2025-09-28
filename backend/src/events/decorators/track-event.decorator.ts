import { SetMetadata } from '@nestjs/common';

export interface TrackEventOptions {
  eventType: string;
  resourceType: string;
  extractResourceId?: (...args: any[]) => string | undefined;
  extractEventData?: (...args: any[]) => Record<string, any>;
}

export const TRACK_EVENT_METADATA = 'track_event';

export const TrackEvent = (options: TrackEventOptions) => {
  return SetMetadata(TRACK_EVENT_METADATA, options);
};
