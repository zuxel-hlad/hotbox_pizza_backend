import { CreateExtraIngredientRequestDto, UpdateExtraIngredientRequestDto } from '@app/extra-ingredient/dto';
import { ExtraIngredientEntity } from '@app/extra-ingredient/extra.ingredient.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResult } from 'typeorm/browser';

@Injectable()
export class ExtraIngredientService {
  constructor(
    @InjectRepository(ExtraIngredientEntity)
    private readonly extraIngredientRepository: Repository<ExtraIngredientEntity>,
  ) {}

  async create(ingredientDto: CreateExtraIngredientRequestDto): Promise<ExtraIngredientEntity> {
    const isIngredientExist = await this.extraIngredientRepository.findOne({
      where: { nameEn: ingredientDto.nameEn, nameUa: ingredientDto.nameUa },
    });

    if (isIngredientExist) {
      throw new HttpException('Extra ingredient already exist.', HttpStatus.BAD_REQUEST);
    }

    const newExtraIngredient = Object.assign(new ExtraIngredientEntity(), ingredientDto);
    return await this.extraIngredientRepository.save(newExtraIngredient);
  }

  async update(ingredientDto: UpdateExtraIngredientRequestDto, ingredientId: number): Promise<ExtraIngredientEntity> {
    const ingredient = await this.extraIngredientRepository.findOne({ where: { id: ingredientId } });

    if (!ingredient) {
      throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
    }

    const updatedIngredient = Object.assign(ingredient, ingredientDto);
    return await this.extraIngredientRepository.save(updatedIngredient);
  }

  async delete(ingredientId: number): Promise<DeleteResult> {
    const ingredient = await this.extraIngredientRepository.findOne({ where: { id: ingredientId } });

    if (!ingredient) {
      throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
    }

    return await this.extraIngredientRepository.delete(ingredient);
  }

  async findAll(): Promise<ExtraIngredientEntity[]> {
    return await this.extraIngredientRepository.find();
  }
}
