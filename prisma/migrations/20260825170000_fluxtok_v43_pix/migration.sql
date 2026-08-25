-- Fluxtok v4.3: pagamentos Pix avulsos de 30 dias via Mercado Pago.
CREATE TABLE `pix_payments` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `plan` ENUM('STARTER','PRO') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'creating',
  `externalPaymentId` VARCHAR(191) NULL,
  `qrCode` TEXT NULL,
  `qrCodeBase64` TEXT NULL,
  `ticketUrl` TEXT NULL,
  `expiresAt` DATETIME(3) NULL,
  `approvedAt` DATETIME(3) NULL,
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `consentVersion` VARCHAR(191) NOT NULL,
  `consentIpHash` VARCHAR(191) NULL,
  `consentUserAgent` TEXT NULL,
  `consentAcceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `pix_payments_externalPaymentId_key`(`externalPaymentId`),
  UNIQUE INDEX `pix_payments_idempotencyKey_key`(`idempotencyKey`),
  INDEX `pix_payments_companyId_status_idx`(`companyId`,`status`),
  INDEX `pix_payments_companyId_createdAt_idx`(`companyId`,`createdAt`),
  INDEX `pix_payments_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pix_payments`
  ADD CONSTRAINT `pix_payments_companyId_fkey`
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pix_payments`
  ADD CONSTRAINT `pix_payments_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
