import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { trainingData } from './data';
import type { Course, CourseStatus, TrainingCategory } from './types';

interface TrainingTotals {
  inProgress: number;
  overallProgress: number;
  totalCompleted: number;
  totalCourses: number;
}

interface TrainingContextValue {
  completeModule: (categoryId: string, courseId: string, moduleIndex: number) => void;
  courses: TrainingCategory[];
  getCategory: (categoryId?: string) => TrainingCategory | undefined;
  getCourse: (categoryId?: string, courseId?: string) => Course | undefined;
  totals: TrainingTotals;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export const useTraining = (): TrainingContextValue => {
  const ctx = useContext(TrainingContext);
  if (!ctx) {
    throw new Error('useTraining 必須在 TrainingProvider 內使用');
  }
  return ctx;
};

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<TrainingCategory[]>(trainingData);

  const completeModule = useCallback((categoryId: string, courseId: string, moduleIndex: number) => {
    setCourses(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat;

        const updatedCourses = cat.courses.map(course => {
          if (course.id !== courseId) return course;
          const updatedModules = course.modules.map((m, i) => (i === moduleIndex ? { ...m, completed: true } : m));
          const completedCount = updatedModules.filter(m => m.completed).length;
          const newProgress = Math.round((completedCount / updatedModules.length) * 100);
          const allDone = completedCount === updatedModules.length;
          const newStatus: CourseStatus = allDone ? 'completed' : 'in_progress';
          return { ...course, modules: updatedModules, progress: newProgress, status: newStatus };
        });

        // 若當前課程已完成，解鎖下一個鎖定的課程
        const justCompleted = updatedCourses.find(c => c.id === courseId);
        if (justCompleted?.status === 'completed') {
          const lockedIndex = updatedCourses.findIndex(c => c.status === 'locked');
          if (lockedIndex !== -1) {
            updatedCourses[lockedIndex] = { ...updatedCourses[lockedIndex], status: 'in_progress' };
          }
        }

        const newCompletedCourses = updatedCourses.filter(c => c.status === 'completed').length;
        return { ...cat, courses: updatedCourses, completedCourses: newCompletedCourses };
      })
    );
  }, []);

  const getCategory = useCallback((categoryId?: string) => courses.find(c => c.id === categoryId), [courses]);

  const getCourse = useCallback(
    (categoryId?: string, courseId?: string) =>
      courses.find(c => c.id === categoryId)?.courses.find(co => co.id === courseId),
    [courses]
  );

  const totals = useMemo<TrainingTotals>(() => {
    const totalCourses = courses.reduce((sum, c) => sum + c.totalCourses, 0);
    const totalCompleted = courses.reduce((sum, c) => sum + c.completedCourses, 0);
    const overallProgress = totalCourses > 0 ? Math.round((totalCompleted / totalCourses) * 100) : 0;
    const inProgress = courses.reduce((sum, c) => sum + c.courses.filter(x => x.status === 'in_progress').length, 0);
    return { inProgress, overallProgress, totalCompleted, totalCourses };
  }, [courses]);

  const value = useMemo<TrainingContextValue>(
    () => ({ completeModule, courses, getCategory, getCourse, totals }),
    [completeModule, courses, getCategory, getCourse, totals]
  );

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
};
