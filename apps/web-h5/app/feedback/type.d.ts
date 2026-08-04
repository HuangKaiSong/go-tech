type Status = 'developing' | 'pending' | 'shipped';

interface Comments {
  author: string;
  content: string;
  createdAt: string;
  id: string;
  isOfficial?: boolean;
}

interface Feature {
  author: string;
  category: string;
  comments: Comments[];
  createdAt: string;
  description: string;
  id: string;
  likedBy: string[];
  likes: number;
  shippedAt?: string;
  status: Status;
  subCategory?: string;
  title: string;
  version?: string;
}
