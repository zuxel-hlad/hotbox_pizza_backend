import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/types/role.enum';
import { AuthGuard } from '@core/guards/auth.guard';
import {
  type CreateExtraIngredientRequestDto,
  createExtraIngredientResponseSchema,
  createExtraIngredientSchema,
} from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import {
  type UpdateExtraIngredientRequestDto,
  updateExtraIngredientSchema,
} from '@modules/extra-ingredient/dto/update-extra-ingredient.dto';
import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { ExtraIngredientService } from '@modules/extra-ingredient/extra-ingredient.service';
import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';
import { z } from 'zod';

const ApiIngredientErrors = () =>
  applyDecorators(
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      example: { statusCode: HttpStatus.NOT_FOUND, message: 'Ingredient not found' },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, example: { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden.' } }),
  );

@ApiTags('Extra Ingredients Resource')
@Controller('extra-ingredient')
export class ExtraIngredientController {
  constructor(private readonly extraIngredientService: ExtraIngredientService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @Roles([Role.ADMIN])
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: createExtraIngredientResponseSchema })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, example: { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden.' } })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, schema: { example: { message: 'Extra ingredient already exist.' } } })
  @ApiOperation({ summary: 'Create new ingredient' })
  async create(
    @Body({ schema: createExtraIngredientSchema }) ingredientDto: CreateExtraIngredientRequestDto,
  ): Promise<ExtraIngredientEntity> {
    return await this.extraIngredientService.create(ingredientDto);
  }

  @Put('update/:id')
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.CREATED, standardSchema: createExtraIngredientResponseSchema })
  @ApiIngredientErrors()
  @ApiOperation({ summary: 'Update extra ingredient' })
  @UseGuards(AuthGuard)
  @Roles([Role.ADMIN])
  async update(
    @Body({ schema: updateExtraIngredientSchema }) ingredientDto: UpdateExtraIngredientRequestDto,
    @Param('id', ParseIntPipe) ingredientId: number,
  ): Promise<ExtraIngredientEntity> {
    return await this.extraIngredientService.update(ingredientDto, ingredientId);
  }

  @Delete('delete/:id')
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiIngredientErrors()
  @ApiOperation({ summary: 'Delete extra ingredient' })
  @UseGuards(AuthGuard)
  @Roles([Role.ADMIN])
  async delete(@Param('id', ParseIntPipe) ingredientId: number): Promise<DeleteResult> {
    return await this.extraIngredientService.delete(ingredientId);
  }

  @Get('find-all')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: z.array(createExtraIngredientResponseSchema) })
  @ApiOperation({ summary: 'Find all extra ingredients' })
  async findAll(): Promise<ExtraIngredientEntity[]> {
    return await this.extraIngredientService.findAll();
  }
}
