import { CreateExtraIngredientRequestDto } from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { UpdateExtraIngredientRequestDto } from '@modules/extra-ingredient/dto/update-extra-ingredient.dto';
import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class ExtraIngredientService {
  constructor(
    @InjectRepository(ExtraIngredientEntity)
    private readonly extraIngredientRepository: Repository<ExtraIngredientEntity>,
  ) {}

  async create(ingredientDto: CreateExtraIngredientRequestDto): Promise<ExtraIngredientEntity> {
    const { nameEn, nameUa } = ingredientDto;
    const isIngredientExist = await this.extraIngredientRepository.existsBy({ nameEn, nameUa });

    if (isIngredientExist) {
      throw new HttpException('Extra ingredient already exist.', HttpStatus.BAD_REQUEST);
    }

    return await this.extraIngredientRepository.save(Object.assign(new ExtraIngredientEntity(), ingredientDto));
  }

  async update(ingredientDto: UpdateExtraIngredientRequestDto, ingredientId: number): Promise<ExtraIngredientEntity> {
    const ingredient = await this.extraIngredientRepository.findOne({ where: { id: ingredientId } });

    if (!ingredient) {
      throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
    }

    return await this.extraIngredientRepository.save(Object.assign(ingredient, ingredientDto));
  }

  async delete(ingredientId: number): Promise<DeleteResult> {
    const deleteResult = await this.extraIngredientRepository.delete(ingredientId);

    if (!deleteResult.affected) {
      throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
    }

    return deleteResult;
  }

  async findAll(): Promise<ExtraIngredientEntity[]> {
    return await this.extraIngredientRepository.find();
  }
}
