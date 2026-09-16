'use client';

import Image from 'next/image';
import homeOffice from '@/assets/home-office.jpg';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { DynamicText } from './DynamicI18nText.client';

const defaultContent = [
  {
    key: 'pms',
    title: '更標準，更高效的管理方式',
    description: '業務流程更為正規，更專業',
    image: homeOffice,
    items: ['資訊同步，原來操作幾幾去尋', '多終端同步，TPOA', '節省人力成本，讓租務管理更便捷，更高效']
  },
  {
    key: 'hr',
    title: '更標準，更數碼化的人事管理',
    description: '人事流程規範化，減少人手出錯',
    image: homeOffice,
    items: [
      '考勤、假期、薪資資料即時同步',
      '電腦與手機多終端打卡及審批',
      '節省人事行政成本，讓 HR 工作更簡單、更準確、更高效'
    ]
  }
];

const TestimonialSection = () => {
  const { product } = useProductSelection();

  const currentContent = defaultContent.find(item => item.key === product);

  if (!currentContent) {
    return <div />;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4" data-block-id="home-testimonial" data-block-role="testimonial">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-6xl text-primary/20 font-serif mb-4">"</div>
            <h3
              className="text-xl font-bold text-foreground mb-4"
              data-block-id="home-testimonial"
              data-block-role="title"
            >
              <DynamicText text={currentContent.title} />
            </h3>
            <p
              className="text-muted-foreground mb-4 leading-relaxed"
              data-block-id="home-testimonial"
              data-block-role="description"
            >
              <DynamicText text={currentContent.description} />
            </p>

            <div
              className="space-y-3 mb-6 text-sm text-muted-foreground"
              data-block-id="home-testimonial"
              data-block-role="items"
            >
              {currentContent.items.map(item => (
                <div key={item}>
                  - <DynamicText text={item} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl w-full h-full overflow-hidden shadow-lg relative">
            <Image
              src={currentContent.image}
              alt="Modern workspace"
              data-block-id="home-testimonial"
              data-block-role="image"
              width={728}
              height={320}
              className="w-full h-80 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
