import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/types/role.enum';
import { AuthGuard } from '@core/guards/auth.guard';
import { AdminService } from '@modules/admin/admin.service';
import { adminResponseSchema } from '@modules/admin/dto/admin-response.dto';
import {
  type PagedAdminsRequestDto,
  pagedAdminsRequestSchema,
  pagedAdminsResponseSchema,
} from '@modules/admin/dto/paged-admins.dto';
import { type UpdateAdminRequestDto, updateAdminSchema } from '@modules/admin/dto/update-admin.dto';
import { AdminResponse } from '@modules/admin/types/admin-response';
import { PagedAdminResponse } from '@modules/admin/types/paged-admin-response';
import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

const ApiAdminNotFound = () =>
  applyDecorators(
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      example: { statusCode: HttpStatus.NOT_FOUND, message: 'Admin not found' },
    }),
  );

const ApiEmailTaken = () =>
  applyDecorators(
    ApiResponse({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      example: { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, message: 'Email has been taken' },
    }),
  );

@ApiTags('Admin resource')
@ApiSecurity('Token')
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized.' },
})
@ApiResponse({ status: HttpStatus.FORBIDDEN, example: { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden.' } })
@UseGuards(AuthGuard)
@Roles([Role.ADMIN])
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('list')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: pagedAdminsResponseSchema })
  @ApiOperation({ summary: 'Get admins paged' })
  async findAll(
    @Query({ schema: pagedAdminsRequestSchema }) query: PagedAdminsRequestDto,
  ): Promise<PagedAdminResponse> {
    return await this.adminService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: adminResponseSchema })
  @ApiAdminNotFound()
  @ApiOperation({ summary: 'Find admin by id' })
  async findById(@Param('id', ParseIntPipe) adminId: number): Promise<AdminResponse> {
    return await this.adminService.findById(adminId);
  }

  @Put('update/:id')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: adminResponseSchema })
  @ApiAdminNotFound()
  @ApiEmailTaken()
  @ApiOperation({ summary: 'Update admin' })
  async update(
    @Param('id', ParseIntPipe) adminId: number,
    @Body({ schema: updateAdminSchema }) updateAdminDto: UpdateAdminRequestDto,
  ): Promise<AdminResponse> {
    return await this.adminService.update(adminId, updateAdminDto);
  }

  @Delete('delete/:id')
  @ApiResponse({ status: HttpStatus.OK })
  @ApiAdminNotFound()
  @ApiOperation({ summary: 'Delete admin' })
  async delete(@Param('id', ParseIntPipe) adminId: number): Promise<DeleteResult> {
    return await this.adminService.delete(adminId);
  }
}
