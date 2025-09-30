// Redirect legacy relative imports of Prisma client to the official package
declare module '../../../node_modules/.prisma/client' {
  export * from '@prisma/client';
}

declare module '../../../../node_modules/.prisma/client' {
  export * from '@prisma/client';
}
