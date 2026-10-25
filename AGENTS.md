# AGENTS.md

HotBox Pizza REST API. NestJS 12 (Express), TypeORM 1.x + PostgreSQL, Zod (Standard Schema validation), Swagger, TypeScript 6, Node >= 24.9 (`.nvmrc`).
Runs on port 3000, Swagger UI at `/docs`.

## Communication

- Always reply in the language the user writes in.
- Write plans in the language the user writes in.

## Commands

```bash
npm run dev                 # watch mode
npm run build               # nest build -> dist/
npx tsc --noEmit            # type check
npm run lint                # eslint --fix
npm run format              # prettier (also sorts imports)
npm test                    # unit tests (*.spec.ts)
npm run test:e2e            # e2e tests (*.e2e-spec.ts)

npm run db:create -- src/core/database/migrations/<PascalCaseName>   # generate migration from entity diff
npm run db:migrate                                                    # apply migrations
npm run typeorm -- migration:show                                     # list applied/pending
```

## Structure

```
src/
  main.ts, app.module.ts          bootstrap, Swagger, global filter and validation pipe; registers every feature module
  common/                         framework-level shared code, no feature logic
    decorators/ dto/ filters/ helpers/ pipes/ schemas/ types/
  core/                           infrastructure
    config/jwt.config.ts          JWT secrets and TTLs
    database/                     database.config.ts, data-source.ts (TypeORM CLI), migrations/
    guards/auth.guard.ts
    middleware/auth.middleware.ts
  modules/<feature>/              one Nest module = one folder
```

Feature modules: `auth`, `token`, `user`, `admin`, `mail`, `pizza`, `extra-ingredient`, `order`.
Reference layout is `src/modules/order/`:

```
order.module.ts  order.controller.ts  order.service.ts  order-filters.service.ts
order.entity.ts  order.constants.ts
dto/    create-order.dto.ts, paged-orders.dto.ts, ...
types/  order-response.ts, paged-order-response.ts, ...
```

Path aliases (tsconfig + jest): `@/*` -> `src/*`, `@common/*`, `@core/*`, `@modules/*`, `@test/*` -> `test/*`. Always import via aliases.

## Code principles

- Write code in the style the project is already written in.
- Always follow SOLID and KISS. Follow best practices and design patterns appropriate for TypeScript, NestJS and this project.
- Prioritize clean, efficient and maintainable code. Clean up unused code (imports, variables, methods, files).
- Never add comments: no inline comments, no block comments, no JSDoc, no explanatory notes. Code must speak for itself through clear naming and structure.
- No single-letter names. Exceptions: `i`, `j`, `k` as the index of a simple `for` loop with a 1–3 line body; standard math notation (`x`, `y`).
  - Iterate with meaningful names: `for (const order of orders)`, `pizzas.map((pizza) => ...)`, not `(p) => ...`.
  - Errors: `catch (error)`, not `catch (e)`.
  - Accumulators: `total`, `count`, `result`, not `n`, `s`, `r`.

## Conventions

- File names are kebab-case with a type suffix: `create-order.dto.ts`, `pizza-filters.service.ts`, `user.entity.ts`. No barrel `index.ts` files.
- Type aliases and interfaces live in `<feature>/types/` (`account.type.ts`, `order-response.ts`), never declared inline in services or controllers.
- New module: create `src/modules/<feature>/`, follow the `order` layout, register it in `src/app.module.ts`.
- Use another module's service only if that module `exports` it. For another module's entity, add it to your `TypeOrmModule.forFeature([...])`.
- Services inject repositories with `@InjectRepository(XEntity)`; complex filtering/paging goes in `<feature>-filters.service.ts` with `createQueryBuilder`.
- DTOs are Zod schemas plus inferred types in `dto/*.dto.ts`: `export const createOrderSchema = z.strictObject({...})` and `export type CreateOrderRequestDto = z.infer<typeof createOrderSchema>`. Request schemas use `z.strictObject` (unknown keys -> 400). Derive with `.extend()`, `.partial()`, `.pick()`, `.omit()`. Shared field schemas live in `src/common/schemas/` (`phoneSchema`, `passwordSchema`, `httpUrlSchema`, `emptyAsUndefined`).
- Validation: `SchemaValidationPipe` (`@common/pipes/schema-validation.pipe`) is global and validates only params with a schema: `@Body({ schema })`, `@Query({ schema })`, `@Body('user', { schema })`. Never `@UsePipes`. Query numbers use `z.coerce.number()`. Import DTO types into controllers as `type` (`import { type XDto, xSchema }`).
- Error messages are flat strings with the field path (`password should not be empty`, `pizzas.0.count must not be less than 1`), built by `validationErrorMap` in `@common/helpers/validation-error-map.helper`. A message passed to a check (`.min(8, '...')`) overrides it; for `refine` pass `{ params: { constraint: 'must be ...' } }` to get `<field> must be ...`.
- Swagger reads request schemas from `schema` automatically. Responses: `@ApiResponse({ status, standardSchema: xResponseSchema })`. A named body (`@Body('user', ...)`) is not picked up: add `@ApiBody({ schema: toApiSchema(z.object({ user: xSchema })) })` from `@common/helpers/api-schema.helper`. Response schemas must not contain `.transform()` or `z.date()` (not representable in JSON Schema; use `z.iso.datetime()` for dates).
- Every endpoint has `@ApiOperation` and `@ApiResponse`; every controller has `@ApiTags`. Protected routes add `@UseGuards(AuthGuard)` and `@ApiSecurity('Token')`.
- Roles: `Role` from `@common/types/role.enum` (`ADMIN`, `CLIENT`). Restrict a route or controller with `@Roles([Role.ADMIN])` from `@common/decorators/roles.decorator` next to `@UseGuards(AuthGuard)`, plus a `403` `@ApiResponse`. Without `@Roles` any logged-in account passes. Content writes (pizza, extra-ingredient, order update, admin CRUD) are admin-only; profile update and favorites are client-only.
- Current account: `@User()` / `@User('id')` from `@common/decorators/user.decorator` (client, `req.user`) and `@Admin()` / `@Admin('id')` from `@common/decorators/admin.decorator` (admin, `req.admin`). Only one of them is set per request.
- Errors: throw `HttpException` or built-in Nest exceptions from services. `HttpExceptionFilter` formats the response.
- Auth: header `Authorization: Token <jwt>`. The JWT payload carries `role`; `AuthMiddleware` loads the admin (`role === ADMIN`) into `req.admin` or the client into `req.user`. Changing a password bumps `tokenVersion` to invalidate old tokens. `POST auth/register` takes `role` and validates fields per role (`z.discriminatedUnion`). Email uniqueness across `users` and `admins` goes through `AdminService.ensureEmailIsFree`.
- Prettier: single quotes, semicolons, trailing commas, printWidth 120.

Example endpoint (`src/modules/order/order.controller.ts`):

```ts
@Post('create')
@ApiResponse({ status: HttpStatus.CREATED, standardSchema: createOrderResponseSchema })
@ApiOperation({ summary: 'Create new order' })
async create(@Body({ schema: createOrderSchema }) newOrder: CreateOrderRequestDto): Promise<OrderResponse> {
  return await this.orderService.create(newOrder);
}
```

## Database

- `synchronize: false`: schema changes only through migrations in `src/core/database/migrations/`.
- Change the entity, then generate the migration with `npm run db:create`. Do not hand-write migrations unless asked.
- Entities are discovered by the glob `**/*.entity.{ts,js}`, so entity files must keep the `.entity.ts` suffix.

## Git

- Branches: `feature/*`, `fix/*`, `chore/*`, `refactor/*`; PRs go to `main`.
- Commit only when the user explicitly asks. When asked, commit as the user: no `Co-Authored-By` trailer, no AI attribution in the message.
- Conventional commits, subject line only: `feat(order): add order CRUD`, `fix: change order search`, `chore(deps): update deps`.
- Pre-commit hook (husky + lint-staged) runs eslint and prettier on staged `*.ts`.

## Boundaries

- **Always:** run `npx tsc --noEmit` and `npm run lint` before finishing; follow the `order` module layout; keep Swagger decorators in sync with DTO schemas.
- **Ask first:** adding dependencies; creating or running migrations; changing the auth flow or API response shapes; using `forwardRef` or `@Global()`; renaming routes.
- **Never:** commit `.env` or secrets; edit already-applied migrations; enable `synchronize: true`; commit or push without an explicit user request; add `Co-Authored-By` or other AI attribution to commits.

## Known gaps (do not fix unless asked)

- DB connection (`src/core/database/database.config.ts`) and JWT secrets (`src/core/config/jwt.config.ts`) are hard-coded, not read from `.env`.
- Password-reset OTP is kept in memory in `AuthService` (not per user, no expiry).
- Admin registration is public: anyone can call `POST auth/register` with `role: ADMIN`.
- `POST order/payment` and order reads (`order/list`, `order/:id`) have no `AuthGuard`.
