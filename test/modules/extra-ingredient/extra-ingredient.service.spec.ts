import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { ExtraIngredientService } from '@modules/extra-ingredient/extra-ingredient.service';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { Repository } from 'typeorm';

describe('ExtraIngredientService', () => {
  const ingredientDto = { nameEn: 'Cheese', nameUa: 'Сир', calories: 120, price: 30 };
  let ingredientRepository: RepositoryMock;
  let ingredientService: ExtraIngredientService;

  beforeEach(() => {
    ingredientRepository = createRepositoryMock();
    ingredientService = new ExtraIngredientService(
      ingredientRepository as unknown as Repository<ExtraIngredientEntity>,
    );
  });

  describe('create', () => {
    it('rejects a duplicate', async () => {
      ingredientRepository.existsBy.mockResolvedValue(true);

      await expect(ingredientService.create(ingredientDto)).rejects.toMatchObject({
        message: 'Extra ingredient already exist.',
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('saves a new ingredient', async () => {
      ingredientRepository.existsBy.mockResolvedValue(false);

      const ingredient = await ingredientService.create(ingredientDto);

      expect(ingredient).toBeInstanceOf(ExtraIngredientEntity);
      expect(ingredient).toMatchObject(ingredientDto);
    });
  });

  describe('update', () => {
    it('rejects an unknown ingredient', async () => {
      ingredientRepository.findOne.mockResolvedValue(null);

      await expect(ingredientService.update({ price: 40 }, 1)).rejects.toMatchObject({
        message: 'Ingredient not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('merges and saves the changes', async () => {
      ingredientRepository.findOne.mockResolvedValue({ id: 1, ...ingredientDto });

      await expect(ingredientService.update({ price: 40 }, 1)).resolves.toEqual({ id: 1, ...ingredientDto, price: 40 });
    });
  });

  describe('delete', () => {
    it('rejects an unknown ingredient', async () => {
      ingredientRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(ingredientService.delete(1)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('deletes the ingredient by id', async () => {
      ingredientRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(ingredientService.delete(1)).resolves.toEqual({ affected: 1 });
      expect(ingredientRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  it('finds all ingredients', async () => {
    ingredientRepository.find.mockResolvedValue([ingredientDto]);

    await expect(ingredientService.findAll()).resolves.toEqual([ingredientDto]);
  });
});
