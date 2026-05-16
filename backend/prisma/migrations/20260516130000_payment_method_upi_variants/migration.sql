-- Add specific UPI / online payment variants to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CANARA_UPI';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BOB_UPI';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'UPI_BHARATH';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'UPI_POORNIMA';
