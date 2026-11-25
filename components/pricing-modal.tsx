"use client";

import { useState } from "react";
import { Check, X, Zap, Shield, ArrowRight } from "lucide-react";
import { useProspects } from "@/components/data-provider";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription";

export function PricingModal() {
  const {
    subscription,
    isGuest,
    upgradeSubscription,
    pricingModalOpen,
    setPricingModalOpen,
  } = useProspects();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  if (!pricingModalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setPricingModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Subscription and Search Quota Plans"
    >
      <div
        className="pricing-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pricing-modal-head">
          <div className="pricing-head-copy">
            <span className="pricing-badge">
              <Zap size={13} className="text-amber" />
              <span>SUBSCRIPTION PLANS & SEARCH QUOTAS</span>
            </span>
            <h2>Choose the Right Plan for Your Scout Operations</h2>
            <p>
              Current Quota:{" "}
              <strong>
                {subscription.totalQuota === -1
                  ? "Unlimited Searches (Enterprise)"
                  : `${subscription.searchesRemaining} of ${subscription.totalQuota} searches remaining`}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="icon-button modal-close-btn"
            onClick={() => setPricingModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="pricing-toggle-wrap">
          <button
            type="button"
            className={`pricing-toggle-pill ${billingCycle === "monthly" ? "active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`pricing-toggle-pill ${billingCycle === "annual" ? "active" : ""}`}
            onClick={() => setBillingCycle("annual")}
          >
            Annual Billing <span className="save-badge">Save 20%</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const isCurrent = subscription.planId === tier.id;
            const price =
              billingCycle === "monthly" ? tier.priceMonthly : Math.round(tier.priceAnnual / 12);

            return (
              <div
                key={tier.id}
                className={`pricing-card ${tier.popular ? "popular" : ""} ${
                  isCurrent ? "current" : ""
                }`}
              >
                {tier.badge && <span className="tier-tag">{tier.badge}</span>}

                <div className="tier-head">
                  <h3 className="tier-name">{tier.name}</h3>
                  <p className="tier-desc">{tier.description}</p>
                </div>

                <div className="tier-price-box">
                  <div className="tier-price">
                    <span className="currency">{tier.currency}</span>
                    <span className="amount">{price}</span>
                    <span className="period">/mo</span>
                  </div>
                  <div className="tier-quota-pill">
                    <Zap size={12} />
                    <span>
                      {tier.searchQuota === -1
                        ? "Unlimited Searches"
                        : `${tier.searchQuota} Searches / mo`}
                    </span>
                  </div>
                </div>

                <ul className="tier-features">
                  {tier.features.map((feat, idx) => (
                    <li key={idx}>
                      <Check size={14} className="feature-check" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`button tier-cta ${
                    isCurrent
                      ? "current-btn"
                      : tier.popular
                      ? "primary glow"
                      : "secondary"
                  }`}
                  disabled={isCurrent || isGuest}
                  title={isGuest ? "Sign in to change your workspace plan" : undefined}
                  onClick={() => upgradeSubscription(tier.id)}
                >
                  {isCurrent ? (
                    <span>Current Active Plan</span>
                  ) : isGuest ? (
                    <span>Sign In to Select</span>
                  ) : (
                    <>
                      <span>Select {tier.name}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="pricing-footer">
          <div className="guarantee-item">
            <Shield size={16} className="text-green" />
            <span>
              {isGuest
                ? "Sign in with a workspace account to manage plans · Search quotas are enforced server-side"
                : "Billing integration (Stripe) required for upgrades above the 50-search Free Trial quota"}
            </span>
          </div>
          <button
            type="button"
            className="guarantee-link"
            onClick={() => setPricingModalOpen(false)}
          >
            Continue with current quota
          </button>
        </div>
      </div>
    </div>
  );
}
