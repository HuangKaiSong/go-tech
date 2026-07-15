import { createFileRoute } from '@tanstack/react-router';

import ApprovalRuleFormView from '../modules/approval-rule/ApprovalRuleFormView';

export const Route = createFileRoute('/(admin)/(daily)/attendance/approval/rules/new')({
  component: RouteComponent,
  staticData: {
    menu: {
      hide: true
    },
    title: '新增審批規則'
  }
});

function RouteComponent() {
  return <ApprovalRuleFormView />;
}
