// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';

import { audienceProducts, audiences } from '@/app/components/blockDefaults';

const features = [
  {
    number: 1,
    title: '節省時間和精力，徹底解放業主',
    description: '一站式處理日常事務：賬單通知、收租跟進、維修安排、投訴與紀錄集中管理，減少重複溝通與分散操作。',
    subDescription: '簡單易用：報表與資料隨時查看，手機／電腦皆可操作，讓忙碌業主亦能輕鬆管理出租事務。'
  },
  {
    number: 2,
    title: '優化租務管理，提升出租效率',
    description: '狀況一目了然：快速掌握各物業入住、空置與租約狀態，便於統一部署與跟進。',
    subDescription: '提升決策質素：以清晰數據支持租金、續約與招租安排，縮短空置期、提升出租表現'
  },
  {
    number: 3,
    title: '保障財務清晰，避免收益損失',
    description: '收支有據可查：租金、按金、管理費等明細統一記錄，對賬更快捷。',
    subDescription: '分類清晰：財務資料結構化呈現，帳目更透明，減少遺漏與爭議。'
  },
  {
    number: 4,
    title: '簡化維修溝通，保持物業價值',
    description: '維修流程更順暢：維修事項、相片與跟進紀錄集中整理，方便業主、租戶與師傅溝通。',
    subDescription: '進度可追蹤：每宗個案的處理狀態清晰可見，提升服務效率與住戶體驗。'
  },
  {
    number: 5,
    title: '降低風險，管理更合規',
    description: '文件集中管理：合約、身份文件、收據等統一保存，查找方便、降低遺失風險。',
    subDescription: '重要事項有系統記錄：到期／續約／檢查等關鍵節點可統一管理，提升合規與管治水平。'
  }
];

const comparisonData = [
  {
    category: '招租',
    traditional: '分散在不同平台發佈與回覆，資料難統一、易遺漏。',
    system: '多平台招租資訊集中管理，線索與進度清晰可跟進。'
  },
  {
    category: '收租',
    traditional: '逐一通知、手動對賬，追租費時且容易出錯。',
    system: '租金狀態統一記錄，支援提醒與對賬管理，收租更有序。'
  },
  {
    category: '維修',
    traditional: '以訊息往來為主，照片／報價／進度分散，難追蹤。',
    system: '維修個案集中建檔，支援上傳相片與紀錄，進度清楚可查。'
  },
  {
    category: '財務',
    traditional: '依賴 Excel / 手寫紀錄，分類不一，難即時掌握收支。',
    system: '收支分類與明細集中整理，報表更清晰，便於核算。'
  },
  {
    category: '文件',
    traditional: '紙本／散落保存，查找困難，存在遺失風險。',
    system: '合約與文件集中電子化管理，檢索更快、保存更穩妥。'
  },
  {
    category: '風險',
    traditional: '到期事項靠人手記錄，容易漏跟進。',
    system: '關鍵日期與事項可統一管理並設提醒，降低遺漏風險。'
  }
];

export const targetAudienceContent = {
  pms: {
    audiences,
    features,
    comparisonData,
    comparisonTitle: '使用物業管理系統'
  },
  hr: {
    audiences: audienceProducts.find(product => product.key === 'hr')?.audiences ?? [],
    features: [
      {
        number: 1,
        title: '人事檔案集中管理，資料不再散落',
        description: '員工資料、合約、證件與異動記錄集中存放，入職離職流程標準化，交接不漏項。',
        subDescription: '組織架構、部門與職位一目了然，人員調配與權限設定同步更新。'
      },
      {
        number: 2,
        title: '考勤假期一站處理，減省行政工時',
        description: '支援手機 GPS 打卡、排班輪更與外勤紀錄，出勤異常自動標示。',
        subDescription: '假期額度自動計算，申請與審批線上完成，全程留痕可追溯。'
      },
      {
        number: 3,
        title: '薪資計算自動準確，出糧不再加班',
        description: '薪資方案可按職位、部門自訂，考勤數據直接貫通薪資計算。',
        subDescription: '獎金、罰款、津貼與扣減一併核算，發薪記錄與薪資單自動生成。'
      },
      {
        number: 4,
        title: '績效與培訓並重，助員工持續成長',
        description: '考核方案彈性設定，績效評估流程線上進行，結果與晉升薪酬掛鈎。',
        subDescription: '培訓計劃與培訓記錄完整保存，形成人才發展閉環。'
      },
      {
        number: 5,
        title: '報表分析支援決策，按人數彈性開通',
        description: '人力成本、流失率、出勤與加班數據自動匯總，管理層決策有據可依。',
        subDescription: '按員工人數彈性開通，企業成長時隨時加購名額，無需更換系統。'
      }
    ],
    comparisonData: [
      {
        category: '入職離職',
        traditional: '紙本表格與人手交接，資料容易遺漏。',
        system: '線上入職流程與離職清單，步驟自動追蹤。'
      },
      {
        category: '員工檔案',
        traditional: 'Excel 與文件夾分散存放，難以查找。',
        system: '檔案集中管理，證件到期自動提醒。'
      },
      {
        category: '考勤打卡',
        traditional: '紙本簽到或打卡鐘，統計耗時。',
        system: '手機 GPS／外勤打卡，異常自動標示。'
      },
      {
        category: '假期審批',
        traditional: '口頭或訊息申請，額度靠人手計。',
        system: '線上申請審批，假期額度自動結算。'
      },
      {
        category: '薪資出糧',
        traditional: '手動核算工時與津貼，易出錯。',
        system: '考勤直接貫通薪資，薪資單自動生成。'
      },
      { category: '績效培訓', traditional: '評核靠印象，培訓無記錄。', system: '考核方案標準化，培訓記錄完整留存。' }
    ],
    comparisonTitle: '使用人力資源系統'
  }
};
