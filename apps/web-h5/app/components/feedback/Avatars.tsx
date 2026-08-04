import { Settings, User } from 'lucide-react';

export const UserAvatar = ({ name }: { name: string }) => (
  <div className="w-16 h-16 shrink-0 rounded-md bg-stone-200 flex items-center justify-center text-stone-400">
    <User className="w-8 h-8" strokeWidth={1.5} />
    <span className="sr-only">{name}</span>
  </div>
);

export const OfficialAvatar = () => (
  <div className="w-16 h-16 shrink-0 rounded-md bg-stone-900 text-white flex flex-col items-center justify-center leading-none">
    <Settings className="w-4 h-4 text-primary mb-1" strokeWidth={2.5} />
    <span className="text-[10px] font-bold tracking-wider">GO-TECH</span>
    <span className="text-[8px] tracking-widest text-stone-400 mt-0.5">MANAGER</span>
  </div>
);

export const SmallUserAvatar = () => (
  <div className="w-10 h-10 shrink-0 rounded-md bg-stone-200 flex items-center justify-center text-stone-400">
    <User className="w-5 h-5" strokeWidth={1.5} />
  </div>
);

export const SmallOfficialAvatar = () => (
  <div className="w-10 h-10 shrink-0 rounded-md bg-stone-900 text-white flex flex-col items-center justify-center leading-none">
    <span className="text-[8px] font-bold tracking-wide text-primary">GO</span>
    <span className="text-[7px] tracking-widest text-stone-300 mt-0.5">MGR</span>
  </div>
);
