import {
  CreateExtraIngredientRequestDto,
  CreateExtraIngredientResponseDto,
  UpdateExtraIngredientRequestDto,
  UpdateExtraIngredientResponseDto,
} from '@app/extra-ingredient/dto';
import { ExtraIngredientEntity } from '@app/extra-ingredient/extra.ingredient.entity';
import { ExtraIngredientService } from '@app/extra-ingredient/extra.ingredient.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import {
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
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

@ApiTags('Extra Ingredients Resource')
@Controller('extra-ingredient')
export class ExtraIngredientController {
  constructor(private readonly extraIngredientService: ExtraIngredientService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  @ApiSecurity('Token')
  @ApiBody({ type: CreateExtraIngredientRequestDto })
  @ApiResponse({ status: HttpStatus.OK, type: CreateExtraIngredientResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, schema: { example: { message: 'Extra ingredient already exist.' } } })
  @ApiOperation({ summary: 'Create new ingredient' })
  async create(@Body() ingredientDto: CreateExtraIngredientRequestDto): Promise<ExtraIngredientEntity> {
    return await this.extraIngredientService.create(ingredientDto);
  }

  @Put('update/:id')
  @ApiSecurity('Token')
  @ApiBody({ type: UpdateExtraIngredientRequestDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: UpdateExtraIngredientResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Ingredient not found' },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Not authorized' },
  })
  @ApiOperation({ summary: 'Update extra ingredient' })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async update(
    @Body() ingredientDto: UpdateExtraIngredientRequestDto,
    @Param('id', ParseIntPipe) ingredientId: number,
  ): Promise<ExtraIngredientEntity> {
    return await this.extraIngredientService.update(ingredientDto, ingredientId);
  }

  @Delete('delete/:id')
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Ingredient not found' },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Not authorized' },
  })
  @ApiOperation({ summary: 'Delete extra ingredient' })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
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
