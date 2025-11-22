import { ExtraIngredientController } from '@app/extra-ingredient/extra.ingredient.controller';
import { ExtraIngredientEntity } from '@app/extra-ingredient/extra.ingredient.entity';
import { ExtraIngredientService } from '@app/extra-ingredient/extra.ingredient.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ExtraIngredientEntity])],
  controllers: [ExtraIngredientController],
  providers: [ExtraIngredientService],
})
export class ExtraIngredientModule {}
