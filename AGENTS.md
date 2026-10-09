# AGENTS.md

HotBox Pizza REST API. NestJS 12 (Express), TypeORM 1.x + PostgreSQL, class-validator, Swagger, TypeScript 6, Node >= 24.9 (`.nvmrc`).
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
npm test                    # unit tests (jest)
npm run test:e2e            # e2e tests (test/jest-e2e.json)

npm run db:create -- src/core/database/migrations/<PascalCaseName>   # generate migration from entity diff
npm run db:migrate                                                    # apply migrations
npm run typeorm -- migration:show                                     # list applied/pending
```

Known issue: `npm test` currently fails with "Must use import to load ES Module" for `@nestjs/common` (jest/ESM setup, not your change).

## Structure

```
src/
  main.ts, app.module.ts          bootstrap, Swagger, global filter; registers every feature module
  common/                         framework-level shared code, no feature logic
    constants/ decorators/ dto/ filters/ helpers/ types/
  core/                           infrastructure
    config/jwt.config.ts          JWT secrets and TTLs
    database/                     database.config.ts, data-source.ts (TypeORM CLI), migrations/
    guards/auth.guard.ts
    middleware/auth.middleware.ts
  modules/<feature>/              one Nest module = one folder
```

Feature modules: `auth`, `token`, `user`, `mail`, `pizza`, `extra-ingredient`, `order`.
Reference layout is `src/modules/order/`:

```
order.module.ts  order.controller.ts  order.service.ts  order-filters.service.ts
order.entity.ts  order.constants.ts
dto/    create-order.dto.ts, paged-orders.dto.ts, ...
types/  order-response.ts, paged-order-response.ts, ...
```

Path aliases (tsconfig + jest): `@/*` -> `src/*`, `@common/*`, `@core/*`, `@modules/*`. Always import via aliases.

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
- New module: create `src/modules/<feature>/`, follow the `order` layout, register it in `src/app.module.ts`.
- Use another module's service only if that module `exports` it. For another module's entity, add it to your `TypeOrmModule.forFeature([...])`.
- Services inject repositories with `@InjectRepository(XEntity)`; complex filtering/paging goes in `<feature>-filters.service.ts` with `createQueryBuilder`.
- DTOs are classes (never interfaces) with `readonly` fields, class-validator decorators and `@ApiProperty`.
- Validation is per route: `@UsePipes(new ValidationPipe(validationsSettings))` from `@common/constants/validation.constants`.
- Every endpoint has `@ApiOperation` and `@ApiResponse`; every controller has `@ApiTags`. Protected routes add `@UseGuards(AuthGuard)` and `@ApiSecurity('Token')`.
- Current user: `@User()` (whole `UserEntity`) or `@User('id')` from `@common/decorators/user.decorator`.
- Errors: throw `HttpException` or built-in Nest exceptions from services. `HttpExceptionFilter` formats the response.
- Auth: header `Authorization: Token <jwt>`. `AuthMiddleware` sets `req.user` on every request. Changing a password bumps `user.tokenVersion` to invalidate old tokens.
- Prettier: single quotes, semicolons, trailing commas, printWidth 120.

Example endpoint (`src/modules/order/order.controller.ts`):

```ts
@Get(':id')
@UsePipes(new ValidationPipe(validationsSettings))
@ApiResponse({ status: HttpStatus.OK, type: CreateOrderResponseDto })
@ApiOperation({ summary: 'Find order by id' })
async findById(@Param('id', ParseIntPipe) orderId: number): Promise<OrderResponse> {
  return await this.orderService.findById(orderId);
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

- **Always:** run `npx tsc --noEmit` and `npm run lint` before finishing; follow the `order` module layout; keep Swagger decorators in sync with DTOs.
- **Ask first:** adding dependencies; creating or running migrations; changing the auth flow or API response shapes; using `forwardRef` or `@Global()`; renaming routes.
- **Never:** commit `.env` or secrets; edit already-applied migrations; enable `synchronize: true`; commit or push without an explicit user request; add `Co-Authored-By` or other AI attribution to commits.

## Known gaps (do not fix unless asked)

- DB connection (`src/core/database/database.config.ts`) and JWT secrets (`src/core/config/jwt.config.ts`) are hard-coded, not read from `.env`.
- Password-reset OTP is kept in memory in `AuthService` (not per user, no expiry).
- Some write routes have no `AuthGuard` (e.g. `DELETE pizza/delete/:id`, `POST extra-ingredient/create`).
