import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { Action, AppAbility } from './casl.types';

@Injectable()
export class CaslAbilityFactory {
  defineAbilityFor(user: JwtUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'admin') {
      can(Action.Manage, 'all');
    } else {
      can(Action.Read, 'Todo');
      can(Action.Create, 'Todo');
      can(Action.Update, 'Todo', { userId: user.userId } as any);
      can(Action.Delete, 'Todo', { userId: user.userId } as any);
    }

    return build();
  }
}
