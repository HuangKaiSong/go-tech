import { Outlet } from 'react-router-dom';
import { TrainingProvider } from './TrainingProvider';

// 培訓模塊布局：提供共享狀態（課程進度等），供各子路由頁面消費
const TrainingLayout = () => (
  <TrainingProvider>
    <Outlet />
  </TrainingProvider>
);

export default TrainingLayout;
