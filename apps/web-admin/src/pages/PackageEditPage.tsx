import { Button } from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getPackage } from './package-edit/package-api';
import { PackageForm } from './package-edit/package-form';
import { createPackageDraft } from './package-edit/package-model';

const PackageEditPage = () => {
  const { packageCode } = useParams();
  const navigate = useNavigate();
  const detailQuery = useQuery({
    queryKey: ['platform/platformPackage/detail', packageCode],
    enabled: Boolean(packageCode),
    queryFn: ({ signal }) => {
      if (!packageCode) throw new Error('缺少套餐編號');
      return getPackage(packageCode, signal);
    }
  });

  if (!packageCode) return <PackageForm key="new" initialData={createPackageDraft()} />;
  if (detailQuery.isPending) {
    return (
      <div role="status" className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        正在載入套餐資料…
      </div>
    );
  }
  if (detailQuery.data) {
    // Background refetches, including failed ones, must not reset unsaved edits.
    return <PackageForm key={packageCode} initialData={detailQuery.data} />;
  }
  if (detailQuery.isError) {
    return (
      <div role="alert" className="space-y-4 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-destructive">{detailQuery.error.message}</p>
        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/packages')}>
            返回套餐列表
          </Button>
          <Button type="button" onClick={() => detailQuery.refetch()}>
            重新載入
          </Button>
        </div>
      </div>
    );
  }
  return null;
};

export default PackageEditPage;
