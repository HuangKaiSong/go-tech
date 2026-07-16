import type { LucideIcon } from 'lucide-react';

export type CourseStatus = 'completed' | 'in_progress' | 'locked';

export interface CourseModule {
  completed: boolean;
  duration: string;
  name: string;
}

export interface Course {
  description: string;
  duration: string;
  id: string;
  modules: CourseModule[];
  progress: number;
  status: CourseStatus;
  title: string;
}

export interface TrainingCategory {
  color: string;
  completedCourses: number;
  courses: Course[];
  description: string;
  icon: LucideIcon;
  id: string;
  title: string;
  totalCourses: number;
}
