import { CreateExtraIngredientRequestDto } from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateExtraIngredientRequestDto extends PartialType(CreateExtraIngredientRequestDto) {}
