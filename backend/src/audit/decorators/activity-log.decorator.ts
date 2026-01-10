import { SetMetadata } from "@nestjs/common";
import { ActivityAction } from "../entities/activity.entity";

export const ACTIVITY_METADATA = 'activity_metadata';

export interface ActivityMetadata {
  action: ActivityAction;
}

export const ActivityLog = (metadata: ActivityMetadata) => SetMetadata(ACTIVITY_METADATA, metadata);