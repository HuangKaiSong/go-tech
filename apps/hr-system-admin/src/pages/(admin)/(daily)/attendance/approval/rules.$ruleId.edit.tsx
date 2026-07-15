import { createFileRoute } from '@tanstack/react-router';

import ApprovalRuleFormView from '../modules/approval-rule/ApprovalRuleFormView';

export const Route = createFileRoute('/(admin)/(daily)/attendance/approval/rules/$ruleId/edit')({
  component: RouteComponent,
  staticData: {
    menu: {
      hide: true
    },
    title: '編輯審批規則'
  }
});

function RouteComponent() {
  const { ruleId } = Route.useParams();

  return <ApprovalRuleFormView ruleId={ruleId} />;
}
