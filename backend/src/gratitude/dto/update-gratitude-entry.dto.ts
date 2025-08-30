import { PartialType } from '@nestjs/swagger';
import { CreateGratitudeEntryDto } from './create-gratitude-entry.dto';

export class UpdateGratitudeEntryDto extends PartialType(CreateGratitudeEntryDto) {}
