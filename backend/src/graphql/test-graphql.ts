// Simple test to verify GraphQL setup
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';

console.log('GraphQL dependencies loaded successfully');
console.log('GraphQL Module:', GraphQLModule);
console.log('Apollo Driver:', ApolloDriver);

// Test GraphQL scalar types
import { GraphQLBigInt, GraphQLDateTime } from './types/common.types';

console.log('Custom scalars loaded:');
console.log('GraphQLBigInt:', GraphQLBigInt);
console.log('GraphQLDateTime:', GraphQLDateTime);

// Test enum registration
import { ViewType, GroupBy, TimeInterval } from './types/common.types';

console.log('Enums loaded:');
console.log('ViewType:', ViewType);
console.log('GroupBy:', GroupBy);
console.log('TimeInterval:', TimeInterval);

console.log('GraphQL setup test completed successfully!');
