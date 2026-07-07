import { clsx } from 'clsx';

import go-techAvatar from '@/assets/imgs/go-tech.jpg';

const go-techAvatar = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div {...props} className={clsx('size-72px overflow-hidden rd-1/2', className)}>
      <img className="size-full" src={go-techAvatar} />
    </div>
  );
};

export default go-techAvatar;
