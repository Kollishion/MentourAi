-- AlterTable
ALTER TABLE `EmailVerificationToken` MODIFY `token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `PasswordResetToken` MODIFY `token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `RefreshToken` MODIFY `token` VARCHAR(512) NOT NULL;
