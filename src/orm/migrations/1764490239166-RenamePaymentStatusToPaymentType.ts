import { MigrationInterface, QueryRunner } from "typeorm";

export class RenamePaymentStatusToPaymentType1764490239166 implements MigrationInterface {
    name = 'RenamePaymentStatusToPaymentType1764490239166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_list" RENAME COLUMN "paymentStatus" TO "paymentType"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_list" RENAME COLUMN "paymentType" TO "paymentStatus"`);
    }

}
