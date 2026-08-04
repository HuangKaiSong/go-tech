import { toast } from '@go-tech-frontend/ui';
import { useState } from 'react';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useAuth } from '@/contexts/AuthContext';

export type Feature = {
  author: string;
  category: string;
  comments: {
    author: string;
    content: string;
    createdAt: string;
    id: string;
    isOfficial?: boolean;
  }[];
  createdAt: string;
  description: string;
  id: string;
  likedBy: string[];
  likes: number;
  shippedAt?: string;
  status: 'developing' | 'pending' | 'shipped';
  subCategory?: string;
  title: string;
  version?: string;
};

export const useFeedbackFeatures = (_categoryName?: string, initialFeatures: Feature[] = []) => {
  const { isLoggedIn } = useAuth();
  const commentFailed = useBatchTranslation('留言失敗');
  const loginRequired = useBatchTranslation('請先登入後再操作');
  const operationFailed = useBatchTranslation('操作失敗');
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);

  const requireLogin = () => {
    if (isLoggedIn) return true;
    toast.warning(loginRequired);
    return false;
  };

  const toggleLike = async (id: string) => {
    if (!requireLogin()) return;

    try {
      const response = await fetch(`/api/feedback/features/${id}/vote`, { method: 'POST' });
      const result = (await response.json()) as {
        data?: { liked: boolean; likes: number; userName: string };
        message?: string;
      };
      if (!response.ok || !result.data) throw new Error(result.message || operationFailed);

      const { liked, likes, userName } = result.data;
      setFeatures(prev =>
        prev.map(feature =>
          feature.id === id
            ? {
                ...feature,
                likedBy: liked
                  ? [...feature.likedBy.filter(name => name !== userName), userName]
                  : feature.likedBy.filter(name => name !== userName),
                likes
              }
            : feature
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : operationFailed);
    }
  };

  const addFeature = (f: Feature) => {
    setFeatures(prev => [f, ...prev]);
  };

  const addComment = async (featureId: string, content: string, turnstileToken: string) => {
    if (!requireLogin()) return false;

    try {
      const response = await fetch(`/api/feedback/features/${featureId}/comments`, {
        body: JSON.stringify({ content, turnstileToken }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const result = (await response.json()) as { data?: Feature['comments'][number]; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message || commentFailed);

      const comment = result.data;
      setFeatures(prev =>
        prev.map(feature =>
          feature.id === featureId ? { ...feature, comments: [...feature.comments, comment] } : feature
        )
      );
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : commentFailed);
      return false;
    }
  };

  return { addComment, addFeature, features, requireLogin, toggleLike };
};

export const formatDate = (iso: string, serverLanguage = 'zh-hk') => {
  const d = new Date(iso);
  const language =
    typeof document === 'undefined'
      ? serverLanguage
      : document.cookie.match(/(?:^|;\s*)GO_TECH_LANGUAGE=([^;]*)/)?.[1] || serverLanguage;

  console.log(language);

  const locale = {
    'zh-cn': 'zh-CN',
    'en-us': 'en-US',
    'zh-hk': 'zh-HK'
  }[language];

  return d.toLocaleDateString(locale || 'zh-HK', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric'
  });
};

export const maskName = (name: string) => {
  if (!name) return '';
  return name[0] + '*'.repeat(Math.max(0, name.length - 1));
};
