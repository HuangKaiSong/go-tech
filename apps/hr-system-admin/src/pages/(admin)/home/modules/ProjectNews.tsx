import { useArray } from '@go-tech/hooks';
import { AnimatePresence, motion } from 'motion/react';

const variants = {
  exit: { opacity: 0, transition: { duration: 0.3 }, x: 200 },
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, transition: { duration: 0.3 }, y: 0 }
};

const ProjectNews = () => {
  const { t } = useTranslation();

  const [newses] = useArray([
    { action: '新員工入職', detail: '張小明 加入技術部', time: '2021-05-28 22:22:22' },
    { action: '請假申請', detail: '李文華 申請年假 3 天', time: '2023-10-27 10:24:54' },
    { action: '績效評估', detail: 'Q2 績效評估已完成 85%', time: '2021-10-31 22:43:12' },
    { action: '培訓通知', detail: '新員工培訓將於下週一開始', time: '2022-11-03 20:33:31' },
    { action: '薪資發放', detail: '6月份薪資已發放完成', time: '2021-11-07 22:45:32' }
  ]);

  return (
    <ACard className="card-wrapper" title={t('page.home.dynamic.title')} variant="borderless">
      <AnimatePresence mode="popLayout">
        <ASpace orientation="vertical" size="large">
          {newses.map(item => (
            <motion.div
              layout // 处理上移、下移等排序动画
              animate="visible" // 动画目标状态
              exit="exit" // 退出时动画
              initial="hidden" // 初始状态
              key={item.time}
              variants={variants} // 应用定义的动画 variants
            >
              <div key={item.time} className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{item.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </ASpace>
      </AnimatePresence>
    </ACard>
  );
};

export default ProjectNews;
