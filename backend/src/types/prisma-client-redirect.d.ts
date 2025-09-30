// Force TypeScript to resolve @prisma/client types to the generated client
// located in the hoisted node_modules/.prisma/client directory
declare module '@prisma/client' {
  export * from '../../node_modules/.prisma/client';
}
