export interface ServiceDto {
  sku: string;
  name: string;
  icon: string | null;
  categorySku: string;
  cancelUrl: string | null;
  pricingUrl: string | null;
}

export interface ServiceListResponse {
  items: ServiceDto[];
  total: number;
}
