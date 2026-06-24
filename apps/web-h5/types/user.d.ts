import type { User as CoreUser } from '@go-tech/core-types';

declare global {
  type User = CoreUser;
}
