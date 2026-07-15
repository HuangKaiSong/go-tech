import { Tooltip } from 'antd';

interface NewFeatureMenuExtraProps {
  /** 菜单标题，用于生成可访问名称。 */
  title?: string;
}

const NewFeatureMenuExtra = (props: NewFeatureMenuExtraProps) => {
  const { title = 'menu' } = props;

  return (
    <Tooltip title="新功能">
      <span
        aria-label={`${title} new feature`}
        className="inline-flex h-18px min-w-36px items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#10b981)] px-7px text-10px text-white font-700 leading-none shadow-[0_4px_12px_rgba(14,165,233,0.28)] ring-1 ring-white/50 dark:bg-[linear-gradient(135deg,#38bdf8,#34d399)] dark:shadow-[0_4px_14px_rgba(45,212,191,0.18)] dark:ring-white/18"
      >
        NEW
      </span>
    </Tooltip>
  );
};

export default NewFeatureMenuExtra;
