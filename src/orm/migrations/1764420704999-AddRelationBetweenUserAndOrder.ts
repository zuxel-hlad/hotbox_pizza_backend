import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationBetweenUserAndOrder1764420704999 implements MigrationInterface {
    name = 'AddRelationBetweenUserAndOrder1764420704999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_list" ("id" SERIAL NOT NULL, "status" character varying NOT NULL, "paymentStatus" character varying NOT NULL, "pizzas" text NOT NULL, "primaryPhone" character varying NOT NULL, "username" character varying NOT NULL, "comment" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_366afe10ad495a0b015eba3958e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameEn"`);
        await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameEn" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameUa"`);
        await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameUa" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_list" ADD CONSTRAINT "FK_8ec25b7db752268020d96da2a27" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_list" DROP CONSTRAINT "FK_8ec25b7db752268020d96da2a27"`);
        await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameUa"`);
        await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameUa" character varying(255) COLLATE "cyrillic_ci" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameEn"`);
        await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameEn" character varying(255) NOT NULL`);
        await queryRunner.query(`DROP TABLE "order_list"`);
    }

}
