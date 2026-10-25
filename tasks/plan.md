# План: переход с class-validator/class-transformer на Zod (Standard Schema, Nest 12)

## Цель

Все DTO проекта описываются Zod-схемами. Валидация идёт через встроенный `StandardSchemaValidationPipe`
(`@nestjs/common`), Swagger строит схемы из тех же Zod-схем. `class-validator`, `class-transformer`,
`ValidationPipe` и `validationsSettings` из проекта уходят.

Источники: docs.nestjs.com/application/validation#schema-based-validation, docs.nestjs.com/openapi/introduction#standard-schema-zod-valibot.

## Что уже есть в установленных пакетах (проверено в node_modules)

- `@nestjs/common` 12.1: `StandardSchemaValidationPipe`, опция `schema` у `@Body/@Query/@Param`.
- `@nestjs/swagger` 12.0: берёт `schema` из параметров и сам строит requestBody/query; для ответов — `@ApiResponse({ standardSchema })`.
- Zod >= 4.2 отдаёт `~standard.jsonSchema`, поэтому `standardSchemaConverter` и `zod-openapi` не нужны. Ставим `zod@^4.6`.

## Целевой паттерн

```ts
// dto/create-extra-ingredient.dto.ts
export const createExtraIngredientSchema = z.strictObject({
  nameEn: z.string(),
  nameUa: z.string(),
  calories: z.number(),
  price: z.number(),
});
export type CreateExtraIngredientRequestDto = z.infer<typeof createExtraIngredientSchema>;

// controller
@Post('create')
@ApiResponse({ status: HttpStatus.CREATED, standardSchema: createExtraIngredientResponseSchema })
async create(@Body({ schema: createExtraIngredientSchema }) ingredientDto: CreateExtraIngredientRequestDto) {}
```

- Имена типов DTO сохраняем (`export type XDto = z.infer<...>`), чтобы сервисы и `types/` не менялись.
- Схема: `camelCase` + суффикс `Schema` (`loginSchema`, `pagedOrdersRequestSchema`).
- Пайп глобальный: `app.useGlobalPipes(new StandardSchemaValidationPipe())` в `main.ts`. Он проверяет только параметры со `schema`, так что это безопасно. Все `@UsePipes(new ValidationPipe(...))` удаляются.
- `@ApiBody({ type })` для тел с `schema` удаляется (Swagger берёт схему из параметра). Для `@Body('user', { schema })` — проверить, как Swagger рисует обёртку `{ user: ... }`; если криво, оставить `@ApiBody({ schema })` с обёрткой.
- `ParseIntPipe` на `:id` не трогаем — это не DTO.

## Соответствие правил

| class-validator / class-transformer | Zod |
|---|---|
| `whitelist + forbidNonWhitelisted` | `z.strictObject()` (лишний ключ -> `Unrecognized key`) |
| `IsNotEmpty + IsString` | `z.string().min(1)` |
| `MinLength(8, { message })` | `z.string().min(8, 'Password must be more than 8 characters long.')` |
| `IsEmail` | `z.email()` |
| `IsJWT` | `z.jwt()` |
| `IsUrl({ protocols: http/https, require_protocol })` | `z.url({ protocol: /^https?$/ })` |
| `IsDateString` | `z.iso.date()` или `z.iso.datetime()` — выбрать по тому, что шлёт фронт |
| `IsEnum(E)` | `z.enum(E)` |
| `IsInt / IsNumber / Min` | `z.number().int() / z.number() / .min()` |
| `IsArray + ArrayNotEmpty + ValidateNested + Type` | `z.array(itemSchema).min(1)` |
| `ArrayUnique` | `.refine((ids) => new Set(ids).size === ids.length, ...)` |
| `Transform(Number)` в query | `z.coerce.number()` |
| `Transform('' -> undefined)` | `z.preprocess((value) => value \|\| undefined, schema.optional())` |
| `IsPhoneNumber('UA')` | `phoneSchema` (`z.string().refine(isValidPhoneNumber, ...)`, решение 1) |
| `PartialType(Dto)` | `schema.partial()` |
| `extends Dto` | `schema.extend({...})` |
| `createPaginationDto(ItemDto)` | `createPagedSchema(itemSchema)` -> `pagedSchema.extend({ content: z.array(itemSchema) })` |

## Принятые решения

1. **Телефоны — `libphonenumber-js`, международный формат.** Все телефоны (`order.primaryPhone`, `pagedOrders.primaryPhone`, `user.phone`) валидируются через `isValidPhoneNumber(value)` без привязки к стране: номер обязан быть в формате E.164 с кодом страны (`+380...`, `+48...`). Общая схема `phoneSchema` в `src/common/schemas/phone.schema.ts`, переиспользуется во всех DTO. Было: только UA. Это расширение, украинские номера с `+380` проходят как раньше.
2. **Плоские сообщения об ошибках, как раньше у class-validator.** Ответ остаётся `{ statusCode: 400, timestamp, path, message: string[] }`, в `message` — строки без префикса пути и без вложенности, с именем поля в тексте:
   - нет поля -> `password should not be empty`
   - не тот тип -> `password must be a string` / `price must be a number`
   - мало символов/значение меньше -> кастомный текст из схемы, если задан (`Password must be more than 8 characters long.`), иначе `page must not be less than 1`
   - лишнее поле -> `property age should not exist`
   - неверный формат -> `email must be an email`, `primaryPhone must be a valid phone number`, `imgUrl must be a URL address`, `status must be one of the following values: ...`
   
   Реализация в одном месте, `src/common/validation/`:
   - глобальная карта ошибок Zod `z.config({ customError })`, собирает текст из `issue.code` + имя поля (последний сегмент `issue.path`); кастомные сообщения в схемах её перекрывают сами;
   - `exceptionFactory` для пайпа: `new BadRequestException(issues.map((issue) => issue.message))` — без префикса пути.
   
   Пайп регистрируется в `main.ts`: `new StandardSchemaValidationPipe({ exceptionFactory })`. Тест на карту ошибок (по одному кейсу на каждый код).
3. **Глобальный пайп** вместо `@UsePipes` на каждом роуте, AGENTS.md обновляется.
4. **Response-DTO тоже на Zod** (по задаче — «все DTO»). Это схемы только для Swagger через `standardSchema`. Рантайм-проверки ответов не добавляем.
5. **`PagedPizzaResponseDto`** чиним попутно в T6: `content` из `pizzaResponseSchema`, а не из request-DTO.

## Граф зависимостей

```
T1 инфраструктура (zod, глобальный пайп, paged-схема, тест)
 ├─ T2 token        (пилот: проверить пайп + Swagger на одном роуте)
 ├─ T3 auth
 ├─ T4 user
 ├─ T5 extra-ingredient ─┐
 └─ T6 pizza ────────────┼─ T7 order (берёт ответные схемы pizza и extra-ingredient, paged-схему)
                         │
 T8 зачистка: удалить class-validator/class-transformer, ValidationPipe, validationsSettings, обновить AGENTS.md
```

T2–T6 независимы друг от друга после T1. T7 после T5 и T6. T8 последним.
Пока T8 не выполнен, старые и новые DTO живут вместе: глобальный Standard-пайп не трогает параметры без `schema`, старые роуты держат свой `@UsePipes(ValidationPipe)`.

## Задачи

Каждая задача — один модуль целиком: DTO -> контроллер (`schema` + Swagger) -> проверка в Swagger и curl.

### T1. Инфраструктура
- Поставить `zod@^4.6` и `libphonenumber-js` (оба согласованы).
- `src/common/validation/`: карта ошибок `z.config({ customError })` и `exceptionFactory` с плоскими сообщениями (решение 2) + тест на каждый код ошибки.
- `src/common/schemas/phone.schema.ts`: `phoneSchema` через `isValidPhoneNumber`.
- `main.ts`: `app.useGlobalPipes(new StandardSchemaValidationPipe({ exceptionFactory }))`, карта ошибок подключается до создания приложения.
- `src/common/dto/paged.dto.ts`: `pagedSchema`, `pagedRequestSchema` (`z.coerce.number().int().min(1, msg)`), `createPagedSchema(itemSchema)`; типы `PagedRequestDto` и т.д. через `z.infer`.
- `test/common/dto/paged.dto.spec.ts` переписать на `pagedRequestSchema.safeParse`.
- Пока старые `PagedOrdersRequestDto`/`PagedPizzaRequestDto` наследуют класс `PagedRequestDto` — оставить класс до T6/T7 или перевести их в той же задаче. Выбор: класс остаётся в файле до T7, удаляется в T7.

**Готово, когда:** `tsc` и `lint` чистые, тест paged проходит (с учётом известной проблемы jest/ESM — проверить хотя бы через `ts-node`/ручной safeParse), приложение стартует, старые роуты работают как раньше.

### T2. token (пилот)
- `token-response.dto.ts`: `tokenRenewRequestSchema = z.strictObject({ token: z.jwt() })`, ответные `tokenSchema`, `tokenResponseSchema`.
- Контроллер: `@Body({ schema })`, убрать `@UsePipes`, `@ApiBody`; `@ApiResponse({ standardSchema })`.

**Готово, когда:** в `/docs` у `POST token/renew` видно тело `{ token }` и ответ; невалидный токен -> 400 `token must be a jwt string`; без токена -> `token should not be empty`; лишнее поле -> `property foo should not exist`.

### T3. auth
- `register`, `login`, `change-password`, `reset-password`, `verify-reset-password`: схемы + типы.
- `@Body('user', { schema })`, `@Body('password', { schema })` — проверить отображение обёртки в Swagger (см. «Целевой паттерн»). Обёрточные `*RequestDto` удалить, если Swagger строит обёртку сам; иначе превратить в схемы `z.object({ user: registerSchema })` для `@ApiBody({ schema })`.

**Готово, когда:** все 5 роутов в Swagger с верными телами; короткий пароль/плохой email -> 400; регистрация и логин работают end-to-end.

### T4. user
- `update-user.dto.ts`: `updateUserSchema` с `preprocess('' -> undefined)` для `birthDate`, `image`, `phone`; `user-response.dto.ts` -> схемы.

**Готово, когда:** `PUT user` принимает пустые строки как «не менять», валидирует url/телефон/дату; Swagger показывает тело и ответ.

### T5. extra-ingredient
- `createExtraIngredientSchema`, ответная `.extend({ id })`, `updateExtraIngredientSchema = create.partial()`.

**Готово, когда:** create/update валидируются, Swagger корректен.

### T6. pizza
- `pizzaIngredientSchema`, `pizzaSchema` (imgUrl с `'' -> undefined`), `createPizzaResponseSchema = pizzaSchema.extend({ favoritesCount })`, `pizzaResponseSchema`, `updatePizzaSchema = pizzaSchema.partial()`.
- `pagedPizzaRequestSchema = pagedRequestSchema.extend({...})` с `z.coerce.number()` для `priceMin/priceMax`.
- Исправить попутно: `PagedPizzaResponseDto` сейчас строится из **request**-DTO (`createPaginationDto(PagedPizzaRequestDto)`), должен из `pizzaResponseSchema`.

**Готово, когда:** `GET pizza?page=1&pageSize=10&priceMin=100` работает, фильтры/сортировки приходят с правильными типами; create/update валидируются.

### T7. order
- `orderPizzaSchema` (уникальность `extraIngredientsIds` через `refine`), `orderSchema` (`pizzas: z.array(...).min(1)`, телефон), `createOrderResponseSchema`, `createOrderResultSchema` (берёт схемы из T5/T6), `paymentSchema`, `pagedOrdersRequestSchema` с coerce для `userId/orderId`.
- Удалить класс `PagedRequestDto`, оставшийся с T1.
- `types/order-response.ts` (`interface extends CreateOrderResponseDto`) -> работает и с `type`, проверить `tsc`.

**Готово, когда:** создание заказа, оплата и пагинация заказов работают; дубли в `extraIngredientsIds` и пустой `pizzas` -> 400.

### T8. Зачистка
- `grep -r "class-validator\|class-transformer\|ValidationPipe\|validationsSettings" src test` — пусто.
- Удалить `src/common/constants/validation.constants.ts`, `npm uninstall class-validator class-transformer` (спросить).
- AGENTS.md: раздел Conventions — DTO = Zod-схема + `z.infer` тип, `schema` в декораторе, глобальный пайп, `@ApiResponse({ standardSchema })`.

**Готово, когда:** `npx tsc --noEmit`, `npm run lint`, `npm run build` чистые; `/docs` открывается, все эндпоинты с телами/query/ответами.

## Чекпоинты

- **После T1+T2:** показать Swagger и ответ на ошибку пилотного роута. Если Swagger/формат ошибок не устраивает — меняем паттерн до массовой миграции.
- **После T3–T6:** `tsc`, `lint`, ручной прогон роутов модулей.
- **После T7+T8:** полный прогон по `/docs`, ревью диффа.

## Риски

- Тексты ошибок близки к class-validator, но не идентичны дословно для всех кейсов — сверить на чекпоинте 1.
- Телефоны без кода страны (`0501234567`) теперь отклоняются — фронт должен слать E.164.
- `@Body('user', { schema })` в Swagger может отрисоваться не так, как нужно — проверяется на T3.
- `z.iso.date()` vs `datetime()` для `birthDate` — сверить с тем, что реально хранится/шлётся.
- `npm test` уже падает из-за jest/ESM — тест paged нельзя считать проверкой, пока это не починено.
