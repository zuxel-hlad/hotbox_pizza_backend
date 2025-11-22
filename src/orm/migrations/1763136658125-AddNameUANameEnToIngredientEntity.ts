import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameUANameEnToIngredientEntity1763136658125 implements MigrationInterface {
    name = 'AddNameUANameEnToIngredientEntity1763136658125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "extra_ingredients" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "extra_ingredients" ADD "nameEn" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "extra_ingredients" ADD "nameUa" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "extra_ingredients" DROP COLUMN "nameUa"`);
        await queryRunner.query(`ALTER TABLE "extra_ingredients" DROP COLUMN "nameEn"`);
        await queryRunner.query(`ALTER TABLE "extra_ingredients" ADD "name" character varying NOT NULL`);
    }

}
