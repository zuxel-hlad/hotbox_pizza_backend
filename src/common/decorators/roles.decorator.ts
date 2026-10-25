import { Role } from '@common/types/role.enum';
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<Role[]>();
