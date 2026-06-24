const valueAddedServices = [
  { id: 'rentSysPrice' as const, name: '升級營鋪 Module', price: 20 },
  { id: 'venueSysPrice' as const, name: '升級場地 Module', price: 20 },
  { id: 'accountingSysPrice' as const, name: '升級會計 Module', price: 50 },
  { id: 'custServiceSysPrice' as const, name: '升級客服 Module (場務)', price: 20 },
  { id: 'addUnitPrice' as const, name: '增加單位數量', price: 80 }
];

export type SpecificValueAddedServicesId = (typeof valueAddedServices)[number]['id'];

export default valueAddedServices;
