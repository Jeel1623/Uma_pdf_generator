export interface HeaderData {
  companyName: string;
  designName: string;
  date: string;
  mNo: string;
  design: string;
  pick: string;
  party: string;
  orderNo: string;
}

export interface RowData {
  id: string;
  saree: string;
  f1: string;
  f2: string;
  f3: string;
  f4: string;
  f5: string;
  f6: string;
  f7: string;
}

export interface Template {
  id: string;
  name: string;
  header: HeaderData;
  rows: RowData[];
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string; // ISO string
  date: string; // value from header Date field
  designName: string; // value from header Design Name field
  partyName: string; // value from header Party field
  header: HeaderData;
  rows: RowData[];
}
