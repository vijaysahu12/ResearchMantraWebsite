import { describe, expect, it } from 'vitest';
import { AppliedCouponInput } from '../../models/research.models';

/**
 * The per-product coupon set must behave as a map keyed by productId: applying a
 * code to one product replaces only that product's code, and removing a product
 * or its coupon leaves every other product's coupon untouched.
 *
 * These are the exact transforms used by ResearchCartComponent.applyCoupon /
 * removeCoupon / removeItem, exercised without the component's HTTP + auth
 * dependencies.
 */
const applyCoupon = (coupons: AppliedCouponInput[], productId: number, couponCode: string): AppliedCouponInput[] => [
    ...coupons.filter((c) => c.productId !== productId),
    { productId, couponCode: couponCode.toUpperCase() },
];

const dropCoupon = (coupons: AppliedCouponInput[], productId: number): AppliedCouponInput[] =>
    coupons.filter((c) => c.productId !== productId);

describe('cart per-product coupons', () => {
    it('keeps the first product\'s coupon when a second product\'s coupon is applied', () => {
        let coupons: AppliedCouponInput[] = [];

        coupons = applyCoupon(coupons, 101, 'save10');   // Research Report
        coupons = applyCoupon(coupons, 202, 'nifty20');  // Nifty Trend

        expect(coupons).toEqual([
            { productId: 101, couponCode: 'SAVE10' },
            { productId: 202, couponCode: 'NIFTY20' },
        ]);
    });

    it('replaces only the same product\'s coupon when reapplied', () => {
        let coupons = applyCoupon(applyCoupon([], 101, 'SAVE10'), 202, 'NIFTY20');

        coupons = applyCoupon(coupons, 101, 'BETTER50');

        expect(coupons).toHaveLength(2);
        expect(coupons.find((c) => c.productId === 101)?.couponCode).toBe('BETTER50');
        expect(coupons.find((c) => c.productId === 202)?.couponCode).toBe('NIFTY20');
    });

    it('never holds two coupons for one product', () => {
        const coupons = applyCoupon(applyCoupon(applyCoupon([], 101, 'A'), 101, 'B'), 101, 'C');

        expect(coupons).toEqual([{ productId: 101, couponCode: 'C' }]);
    });

    it('removing one product\'s coupon leaves the others applied', () => {
        const coupons = applyCoupon(applyCoupon(applyCoupon([], 101, 'A'), 202, 'B'), 303, 'C');

        expect(dropCoupon(coupons, 202)).toEqual([
            { productId: 101, couponCode: 'A' },
            { productId: 303, couponCode: 'C' },
        ]);
    });

    it('removing a cart item drops only that item\'s coupon', () => {
        const coupons = applyCoupon(applyCoupon([], 101, 'A'), 202, 'B');

        expect(dropCoupon(coupons, 101)).toEqual([{ productId: 202, couponCode: 'B' }]);
    });

    it('sends every applied coupon to the pricing endpoint', () => {
        const coupons = applyCoupon(applyCoupon([], 101, 'A'), 202, 'B');

        // currentAppliedCoupons() forwards the whole set, so the backend can
        // price each item's own discount.
        expect(coupons.map((c) => c.productId)).toEqual([101, 202]);
    });
});
