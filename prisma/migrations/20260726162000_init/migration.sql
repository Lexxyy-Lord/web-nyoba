-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEPOSIT', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'OTP_PURCHASE', 'OTP_REFUND', 'CORRECTION', 'BONUS', 'CASHBACK');

-- CreateEnum
CREATE TYPE "OtpOrderStatus" AS ENUM ('PENDING', 'ORDERING', 'WAITING_OTP', 'OTP_RECEIVED', 'COMPLETED', 'CANCEL_REQUESTED', 'CANCELED', 'EXPIRED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('REQUESTED', 'WAITING_PAYMENT', 'MANUAL_REVIEW', 'SUCCESS', 'CANCELED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PricingScope" AS ENUM ('GLOBAL', 'SERVICE', 'COUNTRY', 'PROVIDER');

-- CreateEnum
CREATE TYPE "ProfitType" AS ENUM ('FIXED', 'PERCENTAGE', 'COMBINED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SECURITY');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "whatsapp" TEXT,
    "avatarUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "locale" TEXT NOT NULL DEFAULT 'id-ID',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "securityNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceLedger" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "debit" BIGINT NOT NULL DEFAULT 0,
    "credit" BIGINT NOT NULL DEFAULT 0,
    "balanceBefore" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "orderId" TEXT,
    "depositId" TEXT,
    "description" TEXT NOT NULL,
    "adminId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpService" (
    "id" TEXT NOT NULL,
    "serviceCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCountry" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "numberId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "prefix" TEXT,
    "flagUrl" TEXT,
    "stockTotal" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpProvider" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "providerExternalId" TEXT NOT NULL,
    "serverId" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "costPrice" BIGINT NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpOperator" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "operatorExternalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpOrder" (
    "id" TEXT NOT NULL,
    "internalOrderNumber" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "countryId" TEXT,
    "providerId" TEXT,
    "operatorId" TEXT,
    "serviceCode" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "countryIso" TEXT,
    "operatorName" TEXT NOT NULL,
    "providerExternalId" TEXT NOT NULL,
    "numberId" INTEGER NOT NULL,
    "operatorExternalId" INTEGER NOT NULL,
    "phoneNumber" TEXT,
    "otpCode" TEXT,
    "otpMessage" TEXT,
    "costPrice" BIGINT NOT NULL,
    "profitAmount" BIGINT NOT NULL,
    "sellingPrice" BIGINT NOT NULL,
    "balanceBefore" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "status" "OtpOrderStatus" NOT NULL DEFAULT 'PENDING',
    "providerStatus" TEXT,
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "refundTransactionId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "providerCreatedAt" TIMESTAMP(3),
    "providerExpiredAt" TIMESTAMP(3),
    "lastPolledAt" TIMESTAMP(3),
    "pollAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpOrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OtpOrderStatus",
    "toStatus" "OtpOrderStatus" NOT NULL,
    "providerStatus" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "internalDepositNumber" TEXT NOT NULL,
    "providerDepositId" TEXT,
    "userId" TEXT NOT NULL,
    "amountRequested" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL DEFAULT 0,
    "amountReceived" BIGINT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'WHATSAPP_ADMIN',
    "status" "DepositStatus" NOT NULL DEFAULT 'REQUESTED',
    "paymentReference" TEXT,
    "proofUrl" TEXT,
    "adminNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "creditedTransactionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositStatusHistory" (
    "id" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "fromStatus" "DepositStatus",
    "toStatus" "DepositStatus" NOT NULL,
    "reason" TEXT,
    "adminId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "PricingScope" NOT NULL,
    "profitType" "ProfitType" NOT NULL,
    "fixedAmount" BIGINT NOT NULL DEFAULT 0,
    "percentage" DECIMAL(7,3) NOT NULL DEFAULT 0,
    "minimumSelling" BIGINT,
    "maximumSelling" BIGINT,
    "roundingIncrement" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "serviceId" TEXT,
    "countryId" TEXT,
    "providerId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "orderId" TEXT,
    "requestMeta" JSONB,
    "responseMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PROCESSING',
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBalance_userId_key" ON "UserBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceLedger_transactionId_key" ON "BalanceLedger"("transactionId");

-- CreateIndex
CREATE INDEX "BalanceLedger_userId_createdAt_idx" ON "BalanceLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceLedger_orderId_idx" ON "BalanceLedger"("orderId");

-- CreateIndex
CREATE INDEX "BalanceLedger_depositId_idx" ON "BalanceLedger"("depositId");

-- CreateIndex
CREATE INDEX "BalanceLedger_type_idx" ON "BalanceLedger"("type");

-- CreateIndex
CREATE UNIQUE INDEX "OtpService_serviceCode_key" ON "OtpService"("serviceCode");

-- CreateIndex
CREATE INDEX "OtpCountry_isoCode_idx" ON "OtpCountry"("isoCode");

-- CreateIndex
CREATE INDEX "OtpCountry_serviceId_active_idx" ON "OtpCountry"("serviceId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OtpCountry_serviceId_numberId_key" ON "OtpCountry"("serviceId", "numberId");

-- CreateIndex
CREATE INDEX "OtpProvider_countryId_available_idx" ON "OtpProvider"("countryId", "available");

-- CreateIndex
CREATE UNIQUE INDEX "OtpProvider_countryId_providerExternalId_key" ON "OtpProvider"("countryId", "providerExternalId");

-- CreateIndex
CREATE INDEX "OtpOperator_providerId_active_idx" ON "OtpOperator"("providerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OtpOperator_providerId_operatorExternalId_key" ON "OtpOperator"("providerId", "operatorExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpOrder_internalOrderNumber_key" ON "OtpOrder"("internalOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OtpOrder_providerOrderId_key" ON "OtpOrder"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpOrder_refundTransactionId_key" ON "OtpOrder"("refundTransactionId");

-- CreateIndex
CREATE INDEX "OtpOrder_userId_status_createdAt_idx" ON "OtpOrder"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OtpOrder_providerOrderId_idx" ON "OtpOrder"("providerOrderId");

-- CreateIndex
CREATE INDEX "OtpOrder_status_lastPolledAt_idx" ON "OtpOrder"("status", "lastPolledAt");

-- CreateIndex
CREATE UNIQUE INDEX "OtpOrder_userId_idempotencyKey_key" ON "OtpOrder"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "OtpOrderStatusHistory_orderId_createdAt_idx" ON "OtpOrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_internalDepositNumber_key" ON "Deposit"("internalDepositNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_providerDepositId_key" ON "Deposit"("providerDepositId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_creditedTransactionId_key" ON "Deposit"("creditedTransactionId");

-- CreateIndex
CREATE INDEX "Deposit_userId_status_createdAt_idx" ON "Deposit"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Deposit_status_createdAt_idx" ON "Deposit"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DepositStatusHistory_depositId_createdAt_idx" ON "DepositStatusHistory"("depositId", "createdAt");

-- CreateIndex
CREATE INDEX "PricingRule_scope_active_priority_idx" ON "PricingRule"("scope", "active", "priority");

-- CreateIndex
CREATE INDEX "PricingRule_serviceId_idx" ON "PricingRule"("serviceId");

-- CreateIndex
CREATE INDEX "PricingRule_countryId_idx" ON "PricingRule"("countryId");

-- CreateIndex
CREATE INDEX "PricingRule_providerId_idx" ON "PricingRule"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActivityLog_adminId_createdAt_idx" ON "AdminActivityLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActivityLog_entityType_entityId_idx" ON "AdminActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_userId_createdAt_idx" ON "ApiRequestLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_success_createdAt_idx" ON "ApiRequestLog"("success", "createdAt");

-- CreateIndex
CREATE INDEX "LoginHistory_email_createdAt_idx" ON "LoginHistory"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_createdAt_idx" ON "LoginHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_userId_scope_key_key" ON "IdempotencyKey"("userId", "scope", "key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLedger" ADD CONSTRAINT "BalanceLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLedger" ADD CONSTRAINT "BalanceLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OtpOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLedger" ADD CONSTRAINT "BalanceLedger_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCountry" ADD CONSTRAINT "OtpCountry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "OtpService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpProvider" ADD CONSTRAINT "OtpProvider_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "OtpCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOperator" ADD CONSTRAINT "OtpOperator_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "OtpProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrder" ADD CONSTRAINT "OtpOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrder" ADD CONSTRAINT "OtpOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "OtpService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrder" ADD CONSTRAINT "OtpOrder_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "OtpCountry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrder" ADD CONSTRAINT "OtpOrder_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "OtpProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrder" ADD CONSTRAINT "OtpOrder_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "OtpOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpOrderStatusHistory" ADD CONSTRAINT "OtpOrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OtpOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositStatusHistory" ADD CONSTRAINT "DepositStatusHistory_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "OtpService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "OtpCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "OtpProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActivityLog" ADD CONSTRAINT "AdminActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

