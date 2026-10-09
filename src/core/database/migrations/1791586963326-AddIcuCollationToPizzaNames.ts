import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIcuCollationToPizzaNames1791586963326 implements MigrationInterface {
  name = 'AddIcuCollationToPizzaNames1791586963326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_list" ALTER COLUMN "nameEn" TYPE character varying COLLATE "und-x-icu"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_list" ALTER COLUMN "nameUa" TYPE character varying COLLATE "und-x-icu"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_list" ALTER COLUMN "nameUa" TYPE character varying COLLATE pg_catalog."default"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_list" ALTER COLUMN "nameEn" TYPE character varying COLLATE pg_catalog."default"`,
    );
  }
}
