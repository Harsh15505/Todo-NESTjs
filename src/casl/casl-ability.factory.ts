import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { Action, AppAbility } from './casl.types';

@Injectable()
export class CaslAbilityFactory {
  defineAbilityFor(user: JwtUser): AppAbility {
    const { can, build, cannot } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'admin') {
      can(Action.Manage, 'all');
    } else {
      can(Action.Read, 'Todo');
      can(Action.Create, 'Todo');
      can(Action.Update, 'Todo', { userId: user.userId } as any);
      can(Action.Delete, 'Todo', { userId: user.userId } as any);
      cannot(Action.Update, 'Todo', { userId: { $ne: user.userId } } as any).because("You can only update your own todo");
      cannot(Action.Delete, 'Todo', { userId: { $ne: user.userId } } as any).because("You can only delete your own todo");
    }

    return build();
  }
}
