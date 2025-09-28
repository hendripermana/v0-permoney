import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../../common/services/request-context.service';
import { UserContextService } from '../services/user-context.service';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly userContextService: UserContextService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctxType = context.getType<'http' | 'graphql' | 'ws' | 'rpc'>();

    // Only for HTTP/GraphQL
    if (ctxType !== 'http' && ctxType !== 'graphql') {
      return next.handle();
    }

    const request = ctxType === 'http'
      ? context.switchToHttp().getRequest()
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      : require('@nestjs/graphql').GqlExecutionContext.create(context).getContext().req;

    const authUser = request?.user;

    if (authUser?.id) {
      const alreadyResolved = authUser.userId && authUser.householdId;

      if (alreadyResolved) {
        this.requestContext.setUserId(authUser.userId);
        if (authUser.householdId) {
          this.requestContext.setHouseholdId(authUser.householdId);
        }
      } else {
        const { userId, householdId } = await this.userContextService.resolveUserContext(authUser.id);

        request.user.userId = userId;
        request.user.householdId = householdId;

        this.requestContext.setUserId(userId);
        this.requestContext.setHouseholdId(householdId);
      }
    }

    return next.handle();
  }
}
