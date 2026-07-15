import { Tooltip } from 'antd';

interface ReleaseChannelMenuExtraProps {
  /** 菜单标题，用于生成可访问名称。 */
  title?: string;
}

const ReleaseChannelMenuExtra = (props: ReleaseChannelMenuExtraProps) => {
  const { title = 'menu' } = props;

  return (
    <Tooltip title="当前版本信息">
      <span
        aria-label={`${title} release channel`}
        className="inline-flex h-18px min-w-34px items-center justify-center gap-4px rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6px text-10px text-emerald-600 font-semibold leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-300"
      >
        <span className="h-5px w-5px rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)] dark:bg-emerald-300" />
        <span>v3</span>
      </span>
    </Tooltip>
  );
};

export default ReleaseChannelMenuExtra;
