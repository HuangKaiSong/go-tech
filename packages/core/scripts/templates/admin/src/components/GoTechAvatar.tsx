import { clsx } from 'clsx';

import Avatar from '@/assets/imgs/go-tech.jpg';

const GoTechAvatar = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div {...props} className={clsx('size-72px overflow-hidden rd-1/2', className)}>
      <img className="size-full" src={Avatar} />
    </div>
  );
};

export default GoTechAvatar;
