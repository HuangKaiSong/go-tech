import { BarChart3, ClipboardCheck, CreditCard, FileText, Users } from 'lucide-react';
import { DynamicText } from './DynamicI18nText';

const steps = [
  {
    step: 'STEP 1',
    icon: FileText,
    title: '填寫表格'
  },
  {
    step: 'STEP 2',
    icon: Users,
    title: '專人聯絡'
  },
  {
    step: 'STEP 3',
    icon: ClipboardCheck,
    title: '開設帳戶'
  },
  {
    step: 'STEP 4',
    icon: CreditCard,
    title: '完成付款'
  },
  {
    step: 'STEP 5',
    icon: BarChart3,
    title: '開始使用系統'
  }
];

const StepsSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-foreground mb-12">
          <DynamicText text="完成登約只需 5 個步驟" />
        </h2>

        <div className="flex flex-wrap justify-center gap-8 md:gap-4">
          {steps.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center w-32 md:w-40">
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 hover:bg-primary/20">
                <item.icon className="w-10 h-10 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary mb-2">{item.step}</span>
              <span className="text-sm font-medium text-foreground">
                <DynamicText text={item.title} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
