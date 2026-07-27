import { ConflictError, NotFoundError } from '../errors/app.error';

export class GroupNotFound extends NotFoundError {
  constructor() {
    super('GROUP_NOT_FOUND', 'Group not found');
  }
}

/**
 * Состояние пользователя не позволяет операцию — это конфликт, а не плохо
 * составленный запрос. Раньше обе ситуации отвечали 400.
 */
export class AlreadyInGroup extends ConflictError {
  constructor() {
    super('ALREADY_IN_GROUP', 'User is already in a group');
  }
}

export class NotInGroup extends ConflictError {
  constructor() {
    super('NOT_IN_GROUP', 'User is not in a group');
  }
}

/** Лидер не может просто уйти: сначала передать группу или удалить её. */
export class LeaderMustTransferFirst extends ConflictError {
  constructor() {
    super(
      'LEADER_MUST_TRANSFER',
      'You are the group leader. Transfer leadership or delete the group before leaving.',
    );
  }
}
