import { ExtraIngredientDto } from '@app/extra-ingredient/dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateExtraIngredientRequestDto extends PartialType(ExtraIngredientDto) {}

export class UpdateExtraIngredientResponseDto extends ExtraIngredientDto {}
