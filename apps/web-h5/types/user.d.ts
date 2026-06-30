import type { User as CoreUser } from '@go-tech/types';

declare global {
  type User = CoreUser;
}
