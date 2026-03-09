<script lang="ts">
  import {
    X,
    ShieldCheck,
    FileText,
    CheckCircle2,
    Lock,
    Navigation as LucideNavigation,
    User,
    ArrowUpRight,
    ArrowRight
  } from "@lucide/svelte";
  import { authState } from "$lib/state/auth.svelte.js";
  import { redeemPayout } from "$lib/state/db.svelte.js";

  let { payout, onClose }: { payout: any; onClose: () => void } = $props();

  let step = $state(1);
  let isProcessing = $state(false);
  let acceptedTerms = $state(true);

  // Derive today's date
  let todayDate = new Date().toLocaleDateString("en-IN");

  async function handleNext() {
    isProcessing = true;
    console.log("Advancing from step:", step);

    // Simulate slight network delay for transitions
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (step < 5) {
      step += 1;
      // When transitioning to Success (Step 5), mutate the mock DB state universally
      if (step === 5) {
        redeemPayout(payout.dbId || payout.id);
      }
    }
    isProcessing = false;
  }

  function formatCurrency(rawAmount: any) {
    if (!rawAmount) return "0";
    if (typeof rawAmount === "number") return rawAmount.toLocaleString("en-IN");
    return String(rawAmount).replace("₹", "");
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4"
>
  <div
    class="relative w-full max-w-[440px] rounded-3xl bg-slate-50 shadow-2xl overflow-hidden scale-100 transition-transform"
  >
    <!-- Close Button (Only show if not verifying/processing) -->
    {#if !isProcessing && step < 5}
      <button
        class="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded bg-[#e82525] text-white transition-transform hover:scale-110 hover:bg-red-700 cursor-pointer"
        onclick={onClose}
      >
        <X
          class="h-4 w-4"
          strokeWidth={3}
        />
      </button>
    {/if}

    <div class="p-8">
      {#if step === 1}
        <!-- STEP 1: OTP Verification -->
        <div class="flex flex-col items-center">
          <h2 class="text-[20px] font-semibold text-[#003366] mb-1">
            OTP Verification
          </h2>
          <p class="text-[12px] font-medium text-slate-500 mb-8 tracking-tight">
            Enter the OTP sent to <strong>+91 8076******</strong>
          </p>

          <div class="flex gap-4 mb-6">
            <input
              type="text"
              class="h-12 w-10 text-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:border-[#0066cc] outline-none shadow-sm"
              value="1"
            />
            <input
              type="text"
              class="h-12 w-10 text-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:border-[#0066cc] outline-none shadow-sm"
              value="4"
            />
            <input
              type="text"
              class="h-12 w-10 text-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:border-[#0066cc] outline-none shadow-sm"
              value="3"
            />
            <input
              type="text"
              class="h-12 w-10 text-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:border-[#0066cc] outline-none shadow-sm"
              value="0"
            />
          </div>

          <p class="text-[10px] font-medium text-slate-400 mb-1">
            I didn't receive the code
          </p>
          <button
            class="text-[11px] font-semibold text-[#0066cc] hover:underline cursor-pointer mb-8"
            >Resend OTP</button
          >

          <button
            class="w-full h-11 rounded-xl bg-[#0066cc] text-[14px] font-semibold text-white shadow-sm hover:bg-[#0052a3] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            onclick={handleNext}
            disabled={isProcessing}
          >
            {isProcessing ? "Verifying..." : "Verify"}
          </button>
        </div>
      {:else if step === 2}
        <!-- STEP 2: NDC Approval Document -->
        <div class="flex flex-col">
          <h2 class="text-[28px] font-[800] text-[#003366] mb-1 tracking-tight">
            NDC Approval Document
          </h2>
          <p class="text-[15px] font-semibold text-slate-700 mb-6 mt-1">
            Review and authorize payment
          </p>

          <div
            class="w-full bg-[#f8f9fa] border border-slate-200/80 rounded-2xl p-6 h-[400px] overflow-y-auto mb-6 shadow-sm"
          >
            <div class="mb-6 text-[13px] text-slate-800 font-medium">
              (On Hospital letter head)
            </div>
            <div
              class="flex items-center justify-center font-[900] text-[18px] text-black mb-6 tracking-tight"
            >
              No Due Certificate
            </div>
            <div
              class="space-y-4 text-[13px] text-slate-800 leading-relaxed font-normal pr-2"
            >
              <p>Date – {todayDate}</p>
              <p>
                <span class="font-semibold">Provider Name and address –</span>
                <span class="font-semibold"
                  >{payout.provider}; 123 Healthcare Avenue, Mumbai</span
                >
              </p>
              <p>
                To,<br />
                Star Health and Allied Insurance Co. Ltd.
              </p>
              <p>
                Subject – No dues again cashless claim no. <span
                  class="font-semibold">{payout.id}</span
                > intimated to Star Health and Allied Insurance Co. Ltd.
              </p>
              <p>
                We wish to inform you that outstanding payment for cashless
                claim no. <span class="font-semibold">{payout.id}</span> with Star
                Health & Allied Insurance Co. Ltd. has been cleared/paid and settled.
              </p>
              <p>
                We acknowledge that there are no further dues/fees/charges
                pending from Star Health and Allied Insurance Co. Ltd.
                pertaining to aforementioned transactions and acknowledge the
                receipt of payments thereof.
              </p>
              <div class="pt-4 space-y-0.5">
                <p>Yours' Sincerely</p>
                <p class="text-slate-400 font-medium">({payout.provider})</p>
              </div>
              <div class="pt-8">
                <p>Seal & signature to be placed here</p>
              </div>
              <div class="pt-6 space-y-0.5">
                <p>
                  Authorized Signatory - <span class="font-semibold"
                    >{authState.user?.name || "Dr. Jane Smith"}</span
                  >
                </p>
                <p>
                  Authorized Signatory – <span class="font-semibold"
                    >Head of Billing</span
                  >
                </p>
              </div>
            </div>
          </div>

          <label class="flex items-center gap-3 cursor-pointer mb-6 group">
            <input
              type="checkbox"
              class="hidden"
              bind:checked={acceptedTerms}
            />
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border {acceptedTerms
                ? 'border-[#1a7f71] bg-[#1a7f71]'
                : 'border-slate-300 bg-white group-hover:border-[#1a7f71]'} transition-colors"
            >
              {#if acceptedTerms}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="20 6 9 17 4 12"></polyline></svg
                >
              {/if}
            </div>
            <span class="text-[15px] font-[600] text-slate-400"
              >Term and condition</span
            >
          </label>

          <button
            class="w-full h-[52px] rounded-xl bg-[#006ee6] text-[16px] font-semibold text-white shadow-sm hover:bg-[#005bbd] transition-transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onclick={handleNext}
            disabled={isProcessing || !acceptedTerms}
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      {:else if step === 3}
        <!-- STEP 3: Payment Gateway (Virtual Card) -->
        <div class="flex flex-col items-center">
          <h2
            class="text-[18px] font-semibold text-[#003366] w-full text-left mb-1"
          >
            Payment Gateway
          </h2>
          <p
            class="text-[12px] font-medium text-slate-500 w-full text-left mb-6"
          >
            Play with virtual card information
          </p>

          <div
            class="w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#003366] via-[#004a99] to-[#001f4d] p-6 shadow-xl mb-6 flex flex-col justify-between text-white relative overflow-hidden"
          >
            <div
              class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            ></div>
            <div
              class="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"
            ></div>

            <div
              class="flex justify-between items-center relative z-10 opacity-90"
            >
              <span class="text-[14px] font-semibold tracking-widest text-blue-200"
                >VIRTUAL CARD</span
              >
              <div class="flex gap-1 items-center">
                <div
                  class="h-6 w-6 rounded-full bg-orange-500/80 mix-blend-multiply"
                ></div>
                <div
                  class="h-6 w-6 -ml-3 rounded-full bg-amber-400/80 mix-blend-multiply"
                ></div>
              </div>
            </div>

            <div class="flex flex-col relative z-10 w-full mt-4">
              <span class="font-mono text-xl tracking-widest text-white/90"
                >4859 2928 **** 5829</span
              >
            </div>

            <div
              class="flex w-full justify-between items-end relative z-10 mt-2"
            >
              <div class="flex flex-col">
                <span
                  class="text-[8px] uppercase tracking-widest text-indigo-200"
                  >Valid Thru</span
                >
                <span class="font-semibold font-mono">11/26</span>
              </div>
              <div class="flex flex-col text-right">
                <span
                  class="text-[8px] uppercase tracking-widest text-indigo-200"
                  >CVV</span
                >
                <span
                  class="font-semibold font-mono text-white bg-white/20 px-2 rounded backdrop-blur"
                  >***</span
                >
              </div>
            </div>
          </div>

          <div
            class="w-full rounded-xl bg-orange-50 border border-orange-100 p-4 flex gap-3 text-[11px] text-orange-800 font-medium mb-6 shadow-sm"
          >
            <ShieldCheck class="h-4 w-4 shrink-0 mt-0.5 text-orange-600" />
            <p>
              Payments are secured and end-to-end encrypted. We do not store any
              card data on our servers.
            </p>
          </div>

          <div
            class="w-full flex items-center justify-between px-2 mb-6 text-slate-800"
          >
            <div class="flex flex-col">
              <span
                class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                >Total Claim</span
              >
              <span class="text-[13px] font-semibold"
                >{payout.program} Insurance</span
              >
            </div>
            <div class="text-[20px] font-semibold">
              ₹{formatCurrency(payout.payableAmount)}
            </div>
          </div>

          <button
            class="w-full h-11 rounded-xl bg-[#0066cc] text-[14px] font-semibold text-white shadow-sm hover:bg-[#0052a3] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            onclick={handleNext}
            disabled={isProcessing}
          >
            {isProcessing ? "Authenticating..." : "Continue to Payment"}
          </button>
        </div>
      {:else if step === 4}
        <!-- STEP 4: Complete Payment -->
        <div class="flex flex-col">
          <h2 class="text-[18px] font-semibold text-[#003366] mb-1">
            Complete Payment
          </h2>
          <p class="text-[12px] font-medium text-slate-500 mb-6">
            Review claim details before deduction
          </p>

          <div
            class="w-full rounded-xl bg-white border border-slate-200 mb-6 overflow-hidden shadow-sm"
          >
            <div
              class="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600"
              >
                <User class="h-5 w-5" />
              </div>
              <div class="flex flex-col">
                <span class="text-[14px] font-semibold text-slate-800"
                  >Sanjay Singh</span
                >
                <span class="text-[11px] font-medium text-slate-500"
                  >**** **** **** 1989</span
                >
              </div>
            </div>

            <div class="p-5 flex flex-col gap-4">
              <div class="flex justify-between items-center text-[12px]">
                <span class="font-medium text-slate-500">Transaction ID</span>
                <span class="font-semibold text-slate-800 font-mono"
                  >{payout.id}</span
                >
              </div>
              <div class="flex justify-between items-center text-[12px]">
                <span class="font-medium text-slate-500">Base Amount</span>
                <span class="font-semibold text-slate-800"
                  >₹{formatCurrency(payout.approvedAmount)}</span
                >
              </div>
              <div class="flex justify-between items-center text-[12px]">
                <span class="font-medium text-slate-500">Applicable GST</span>
                <span class="font-semibold text-slate-800 mt-0">- {payout.gst}</span
                >
              </div>
              <!-- Dotted divider -->
              <div
                class="w-full border-t border-dashed border-slate-200 my-1"
              ></div>
              <div class="flex justify-between items-center">
                <span class="font-semibold text-slate-800 text-[14px]">Total</span>
                <span class="font-semibold text-[#0066cc] text-[18px]"
                  >₹{formatCurrency(payout.payableAmount)}</span
                >
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 mb-6">
            <Lock class="h-3 w-3 text-slate-400" />
            <span class="text-[10px] font-medium text-slate-400"
              >Secured via HDFC Payment Systems</span
            >
          </div>

          <button
            class="w-full h-11 rounded-xl bg-[#0066cc] flex items-center justify-between px-6 text-[14px] font-semibold text-white shadow-sm hover:bg-[#0052a3] transition-all cursor-pointer disabled:opacity-50"
            onclick={handleNext}
            disabled={isProcessing}
          >
            <span
              >{isProcessing
                ? "Processing Transaction..."
                : "Complete Payment"}</span
            >
            {#if !isProcessing}
              <ArrowUpRight class="h-4 w-4" />
            {/if}
          </button>
        </div>
      {:else if step === 5}
        <!-- STEP 5: Success Modal (Themed Blue as requested) -->
        <div class="flex flex-col items-center py-4">
          <div
            class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border-4 border-white shadow-[0_0_15px_rgba(0,102,204,0.15)] bg-gradient-to-tr from-blue-50 to-white"
          >
            <CheckCircle2
              class="h-8 w-8 text-[#0066cc]"
              strokeWidth={2.5}
            />
          </div>

          <h2
            class="text-[22px] font-semibold text-slate-800 tracking-tight leading-none mb-1"
          >
            Payment Successful
          </h2>
          <p class="text-[12px] font-medium text-slate-500 mb-8">
            Your claim has been redeemed
          </p>

          <!-- Receipt Block -->
          <div
            class="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6 flex items-center justify-between"
          >
            <div class="flex flex-col gap-1">
              <span class="text-[13px] font-semibold text-slate-800"
                >{payout.provider}</span
              >
              <span class="text-[10px] font-medium text-slate-400"
                >Nov 28, 2026, 12:30 PM</span
              >
              <span class="font-mono text-[9px] text-slate-300"
                >Txn: {payout.id}</span
              >
            </div>
            <div class="text-[24px] font-semibold text-[#003366] tracking-tight">
              {formatCurrency(payout.payableAmount)}
            </div>
          </div>

          <!-- Timeline box -->
          <div
            class="w-full rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 flex items-start gap-3 mb-8"
          >
            <div class="mt-0.5">
              <FileText class="h-4 w-4 text-slate-400" />
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] font-semibold text-slate-700"
                >Settlement Timeline</span
              >
              <span class="text-[10px] font-medium text-slate-500"
                >The transaction will be settled by PG in T+1 business days.</span
              >
            </div>
          </div>

          <!-- Final Button - Professional Blue -->
          <button
            class="w-full h-11 rounded-xl bg-[#0066cc] flex items-center justify-between px-6 text-[14px] font-semibold text-white transition-all hover:bg-[#0052a3] cursor-pointer shadow-sm"
            onclick={onClose}
          >
            <span>{formatCurrency(payout.payableAmount)}</span>
            <div class="flex items-center">
              <span>Return to Dashboard</span>
              <ArrowRight class="h-4 w-4 ml-1.5" />
            </div>
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
