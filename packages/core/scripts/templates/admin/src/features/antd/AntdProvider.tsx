import { useLang } from '@go-tech/web-admin-i18n';
import { AntdProvider } from '@go-tech/web-admin-theme';
import type { PropsWithChildren } from 'react';

import { antdLocales } from '@/locales/antd';
import { useUserInfoQuery } from '@/service/api';

const AppAntdProvider = (props: PropsWithChildren) => {
  const { children } = props;

  const { locale } = useLang();
  const { data: userInfo } = useUserInfoQuery();

  return (
    <AntdProvider locale={antdLocales[locale]} userName={userInfo?.userName}>
      {children}
    </AntdProvider>
  );
};

export default AppAntdProvider;
