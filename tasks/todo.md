# TODO: class-validator -> Zod

Решения: телефоны через libphonenumber-js (E.164), плоские сообщения как у class-validator, глобальный пайп.

- [x] T1. Инфраструктура: zod + libphonenumber-js, карта ошибок + `exceptionFactory` (плоские сообщения) + тест, `phoneSchema`, глобальный пайп, paged-схемы, тест paged
- [x] T2. token (пилот): схемы + `@Body({ schema })` + `@ApiResponse({ standardSchema })`
- [x] **Чекпоинт 1:** Swagger и ответ на ошибку пилота устраивают
- [x] T3. auth: register, login, change-password, reset-password, verify-reset-password
- [x] T4. user: update-user (`'' -> undefined`), user-response
- [x] T5. extra-ingredient: create, response, update (`.partial()`)
- [x] T6. pizza: ingredient, pizza, create/update, paged request/response (+ fix content type в paged response)
- [x] **Чекпоинт 2:** tsc, lint, ручной прогон роутов
- [x] T7. order: order-pizza, order, create-order response/result, payment, paged orders; удалить класс `PagedRequestDto`
- [x] T8. Зачистка: удалить class-validator/class-transformer, `validation.constants.ts`; обновить AGENTS.md
- [ ] **Чекпоинт 3:** tsc, lint, build, полный прогон `/docs`, ревью
