export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface OtpLoginData {
  result: string;
  publicKey: string;
  oneTimePassword?: string;
  fullName?: string;
}

export interface OtpVerificationData {
  publicKey: string;
  mobileUserId: number;
  name?: string;
  token: string;
  accessToken: string;
  refreshToken?: string;
  isExistingUser: boolean;
}

export interface UserBasicDetails {
  fullName?: string;
  emailId?: string;
  mobile?: string;
  city?: string;
  dob?: string;
  gender?: string;
  publicKey?: string;
  isMobileVerified?: boolean;
}

export interface AuthSession {
  publicKey: string;
  mobileNumber: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
}

export interface SubscriptionDuration {
  subscriptionDurationId: number;
  subscriptionDurationName: string;
  months: number;
  discountPrice: number;
  defaultCouponDiscount?: number;
  subscriptionDurationActive?: boolean;
  couponCode?: string;
  netPayment: number;
  actualPrice: number;
  expireOn?: string;
  perMonth?: string;
  isRecommended?: boolean;
  subscriptionMappingId: number;
}

export interface ResearchSubscriptionPlan {
  productId: number;
  subscriptionPlanId: number;
  name: string;
  paymentGatewayName?: string;
  isPanVerified?: boolean;
  subscriptionDurations: SubscriptionDuration[];
}

export interface PaymentRequestResult {
  link_url: string;
  link_id: string;
  link_status?: string;
  /** Set when a 100%-off coupon zeroed out the amount — the subscription is already
   * granted server-side, so there's no payment link to open. */
  is_free?: boolean;
}

export interface PaymentLinkResult {
  url: string;
  name?: string;
  email?: string;
  amount?: number;
  merchantTransactionId?: string;
  paymentGateway?: string;
  paymentLinkId?: string;
  /** Set by the backend when a 100%-off coupon zeroed out the amount — the purchase is
   * already granted server-side, so there's no gateway link to open. */
  isFree?: boolean;
}

export interface PaymentStatusProduct {
  productId: number;
  name?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  createdOn?: string;
  productValidity?: number;
  /** "PENDING" | "SUCCESS" | "FAILED" */
  paymentStatus?: string;
}

export interface PaymentStatusResult {
  link_id: string;
  link_status: string;
  link_amount?: number;
  link_amount_paid?: number;
}

export interface CartItem {
  id: number;
  productMId: number;
  durationId: number;
  productName?: string;
  productCode?: string;
  productImage?: string;
  listImage?: string;
  description?: string;
  descriptionTitle?: string;
  monthlyPrice: number;
  actualPrice: number;
  price: number;
  isCombo?: boolean;
  comboCode?: string;
  couponDiscountAmount?: number;
  appliedCouponCode?: string;
}

export interface CartSummary {
  items: CartItem[];
  durationId: number;
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  productCount: number;
}

export interface CartDurationSummary {
  subscriptionDurationId: number;
  subscriptionDurationName: string;
  months: number;
  totalAmount: number;
  /** Discount already baked into this duration's pricing (e.g. quarterly/yearly plan pricing), independent of cart size. */
  planDiscountAmount?: number;
  couponDiscountAmount?: number;
  /** The product-count bundle discount tier (or 50 once every eligible product is in the cart). */
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  monthlyAmount: number;
  saving: number;
  productCount: number;
  expireOn: string;
}

export interface CartWithDurations {
  items: CartItem[];
  productCount: number;
  currentDurationId: number;
  durations: CartDurationSummary[];
}

export interface AppliedCouponInput {
  productId: number;
  couponCode: string;
}

export interface GroupedPurchaseOrder {
  transactionId: string;
  paymentDate: string;
  paidAmount: number;
  productCount: number;
  productNames: string[];
  purchaseOrderIds: number[];
}

export interface GroupedReceiptLineItem {
  id: number;
  productId?: number;
  productName?: string;
  startDate?: string;
  endDate?: string;
}

export interface GroupedReceipt {
  transactionId: string;
  customerName?: string;
  email?: string;
  mobile?: string;
  paymentDate: string;
  paidAmount: number;
  items: GroupedReceiptLineItem[];
}

export interface PurchaseHistoryItem {
  id: number;
  productId?: number;
  productName?: string;
  customerName?: string;
  mobile?: string;
  email?: string;
  paidAmount?: number;
  paymentDate: string;
  startDate?: string;
  endDate?: string;
  transactionId?: string;
  transactionReference?: string;
  invoice?: string;
  status?: number;
}

export interface MyBucketItem {
  id: number;
  name: string;
  startdate: string;
  enddate?: string;
  listImage?: string;
  daysToGo?: number;
  showReminder?: boolean;
  categoryName?: string;
  buyButtonText?: string;
  price?: number;
  notificationEnabled?: boolean;
}

export interface TopProduct {
  id: number;
  name: string;
  subTitle?: string;
  shortImage?: string;
  navigationText?: string;
  isActive?: boolean;
  isPurchased?: boolean;
}

export interface ProductListItem {
  id: number;
  name: string;
  productTag?: string;
  description?: string;
  descriptionTitle?: string;
  category?: string;
  groupName?: string;
  price: number;
  listImage?: string;
  landscapeImage?: string;
  heartsCount?: number;
  buyButtonText?: string;
  thumbsUpCount?: number;
  contentCount?: number;
  videoCount?: number;
  userHasHeart?: boolean;
  userHasThumbsUp?: boolean;
  overAllRating?: number;
  userRating?: number;
  liked?: boolean;
  isInMyBucket?: boolean;
  isFreeTrailAvailable?: boolean;
  isInValidity?: boolean;
  isPanVerified?: boolean;
  isInCart?: boolean;
}

export interface ProductDetail {
  id: number;
  name: string;
  productTag?: string;
  code?: string;
  communityId?: number;
  communityName?: string;
  description?: string;
  descriptionTitle?: string;
  categoryId?: number;
  category?: string;
  accessToScanner?: boolean;
  price: number;
  paidAmount?: number;
  landscapeImage?: string;
  buyButtonText?: string;
  showViewButton?: boolean;
  discount?: string;
  userRating?: string;
  liked?: string;
  enableSubscription?: string;
  isHeart?: boolean;
  isThumbsUp?: boolean;
  subscriptionData?: string;
  extraBenefits?: string;
  isInMyBucket?: boolean;
  isInValidity?: boolean;
  isQueryFormEnabled?: boolean;
  contentCount?: number;
  videoCount?: number;
  daysToGo?: number;
  bonusProducts?: string;
  scannerBonusProductId?: string;
  roi?: number;
  accuracy?: number;
  isPanVerified?: boolean;
  isInCart?: boolean;
}

export interface ResearchCompany {
  basketId: number;
  productId: number;
  productName?: string;
  groupName?: string;
  name: string;
  shortSummary?: string;
  publishDate?: string;
  createdOn?: string;
  marketCap?: number;
  pe?: number;
  isFree?: boolean;
  listImage?: string;
  companyStatus?: string;
}

export interface CompaniesResponse {
  companyData: ResearchCompany[];
  hasResearchProduct: boolean;
}

export interface CompanyType {
  ltopUptrend?: boolean;
  stopOpUpTrend?: boolean;
  futuristicSector?: boolean;
  hniInstitutionalPromotersBuy?: boolean;
  specialSituations?: boolean;
  futureVisibility?: boolean;
}

export interface MonthlyPrice {
  month: string;
  price: number;
}

export interface AnnualFinancial {
  year: string;
  sales?: number;
  opProfit?: number;
  netProfit?: number;
  otm?: number;
  npm?: number;
  promotersPercent?: number;
}

export interface CompanyReport {
  companyId: number;
  companyCount: number;
  symbol?: string;
  name: string;
  description?: string;
  chartUrl?: string;
  otherUrl?: string;
  websiteUrl?: string;
  publishDate?: string;
  faceValue?: number;
  currentPrice?: number;
  profitGrowth?: number;
  promotersHolding?: number;
  netWorth?: number;
  commentCount?: number;
  companyType?: CompanyType;
  lastOneYearMonthlyPrices?: MonthlyPrice[];
  lastTenYearSales?: AnnualFinancial[];
}

export interface SharedPostImage {
  name: string;
  aspectRatio?: string;
}

export interface SharedPost {
  objectId: string;
  content: string;
  hashtag?: string;
  createdOn?: string;
  postedAgo?: string;
  userFullName?: string;
  userProfileImage?: string;
  image?: SharedPostImage[];
}

export interface SharedPostFeed {
  blogs: SharedPost[];
}

export interface FreeTrialOffer {
  freeTrialImageUrl?: string;
  buttonText?: string;
}

export interface ActiveTopicsData {
  activeTopics: string[];
  isFreeTrialActive: boolean;
  freeTrial?: FreeTrialOffer;
  discountName?: string;
  discountStatus?: boolean;
  quote?: string;
  author?: string;
  promotionUrl?: string;
  actionUrl?: string;
  appIntroductionUrl?: string;
  showPerformaceTab?: boolean;
}

export interface FreeTrialNewProduct {
  productId: number;
  productName: string;
  startDate: string;
  endDate: string;
}

export interface ActivateFreeTrialResult {
  result: string;
  message: string;
  newProducts: FreeTrialNewProduct[];
}

export interface ProductPerformanceItem {
  id: number;
  stockSymbol: string;
  entryPrice: number;
  exitPrice: number;
  roi: number;
  profit: number;
  duration?: string;
  entryDateTime?: string;
}

/** Dashboard carousel entry — id/name/image only, from GetActiveProductBaskets. */
export interface BasketSummary {
  id: string;
  name: string;
  listImage?: string;
  sortOrder?: number;
}

export interface BasketOverviewItem {
  productId: number;
  productName: string;
  listImage?: string;
  durationName?: string;
  originalPrice: number;
}

/** Full "Basket Overview" breakdown — from GetProductBasketOverview/{id}. */
export interface BasketOverview {
  id: string;
  name: string;
  description?: string;
  listImage?: string;
  /** "PERCENT" | "FLAT" */
  discountType: string;
  discountPercent?: number;
  discountFlatAmount?: number;
  isCurrentlyPurchasable: boolean;
  alreadyPurchased: boolean;
  items: BasketOverviewItem[];
  totalOriginalValue: number;
  totalSavings: number;
  finalAmount: number;
}
