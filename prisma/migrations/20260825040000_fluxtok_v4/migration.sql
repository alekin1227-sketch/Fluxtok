-- Fluxtok v4: suporte interno, configurações globais e registro de consentimentos legais.
CREATE TABLE `platform_settings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'global',
  `supportEmail` VARCHAR(191) NULL,
  `notificationEmail` VARCHAR(191) NULL,
  `supportName` VARCHAR(191) NOT NULL DEFAULT 'Equipe Fluxtok',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_tickets` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT 'Geral',
  `status` ENUM('OPEN','WAITING_SUPPORT','WAITING_CUSTOMER','CLOSED') NOT NULL DEFAULT 'OPEN',
  `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `support_tickets_companyId_status_idx`(`companyId`,`status`),
  INDEX `support_tickets_status_lastMessageAt_idx`(`status`,`lastMessageAt`),
  INDEX `support_tickets_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_messages` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `authorUserId` VARCHAR(191) NULL,
  `sender` ENUM('CUSTOMER','SUPPORT') NOT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `support_messages_ticketId_createdAt_idx`(`ticketId`,`createdAt`),
  INDEX `support_messages_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `legal_acceptances` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `document` ENUM('TERMS','PRIVACY','TRIAL','DATA_PROCESSING','BILLING_RECURRING') NOT NULL,
  `version` VARCHAR(191) NOT NULL,
  `ipHash` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `legal_acceptances_companyId_acceptedAt_idx`(`companyId`,`acceptedAt`),
  INDEX `legal_acceptances_userId_document_acceptedAt_idx`(`userId`,`document`,`acceptedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `support_messages` ADD CONSTRAINT `support_messages_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `support_messages` ADD CONSTRAINT `support_messages_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `legal_acceptances` ADD CONSTRAINT `legal_acceptances_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `legal_acceptances` ADD CONSTRAINT `legal_acceptances_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `platform_settings` (`id`,`supportName`,`createdAt`,`updatedAt`)
VALUES ('global','Equipe Fluxtok',CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));
