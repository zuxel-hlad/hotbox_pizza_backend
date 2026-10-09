import { validationsSettings } from '@common/constants/validation.constants';
import { AuthGuard } from '@core/guards/auth.guard';
import {
  CreateExtraIngredientRequestDto,
  CreateExtraIngredientResponseDto,
} from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { UpdateExtraIngredientRequestDto } from '@modules/extra-ingredient/dto/update-extra-ingredient.dto';
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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

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
  );

@ApiTags('Extra Ingredients Resource')
@Controller('extra-ingredient')
export class ExtraIngredientController {
  constructor(private readonly extraIngredientService: ExtraIngredientService) {}

  @Post('create')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.OK, type: CreateExtraIngredientResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, schema: { example: { message: 'Extra ingredient already exist.' } } })
  @ApiOperation({ summary: 'Create new ingredient' })
  async create(@Body() ingredientDto: CreateExtraIngredientRequestDto): Promise<ExtraIngredientEntity> {
    return await this.extraIngredientService.create(ingredientDto);
  }

  @Put('update/:id')
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateExtraIngredientResponseDto })
  @ApiIngredientErrors()
  @ApiOperation({ summary: 'Update extra ingredient' })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe(validationsSettings))
  async update(
    @Body() ingredientDto: UpdateExtraIngredientRequestDto,
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
  async delete(@Param('id', ParseIntPipe) ingredientId: number): Promise<DeleteResult> {
    return await this.extraIngredientService.delete(ingredientId);
  }

  @Get('find-all')
  @ApiResponse({ status: HttpStatus.OK, type: CreateExtraIngredientResponseDto, isArray: true })
  @ApiOperation({ summary: 'Find all extra ingredients' })
  async findAll(): Promise<ExtraIngredientEntity[]> {
    return await this.extraIngredientService.findAll();
  }
}
