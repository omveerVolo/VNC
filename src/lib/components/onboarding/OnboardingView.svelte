<script lang="ts">
  import { authState } from "$lib/state/auth.svelte.js";
  import {
    Check,
    CheckCircle2,
    Building2,
    ArrowLeft,
    User,
    Shield
  } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import {
    createProgram,
    updateProgram,
    dbStore
  } from "$lib/state/db.svelte.js";

  let { initialStep = 1, editProgramId = null } = $props();

  const dispatch = createEventDispatcher();
  let step = $state(1);

  let initialized = false;
  // Sync initialStep prop cleanly when mounted/changed, and prepopulate if editing
  $effect(() => {
    if (initialStep) {
      step = initialStep;
    }
    if (editProgramId && !initialized) {
      const existing = dbStore.programs.find(
        (p: any) => p.id === editProgramId
      );
      if (existing) {
        programName = existing.name;
        businessCategory = existing.category;
        if (existing.enrolledPayees?.length > 0) {
          payeeEmail = existing.enrolledPayees[0];
        }
        initialized = true;
      }
    }
  });

  // Forms data
  let programName = $state("");
  let businessType = $state("Healthcare");
  let businessCategory = $state("Hospital");
  let deductionSetting = $state("GST %");
  let payeeEmail = $state("");
  let manualEmail = $state(""); // Stores manual email input

  // Used for UI feedback
  let addedPayees = $state<string[]>([]);

  function handleManualAdd() {
    if (manualEmail && manualEmail.includes("@")) {
      addedPayees = [...addedPayees, manualEmail];
      // Sync to final submission pipeline
      payeeEmail = manualEmail;
      manualEmail = "";
    }
  }

  function handleRecommendSelect(email: string) {
    addedPayees = [...addedPayees, email];
    payeeEmail = email; // Lock it for submission
  }

  function nextStep() {
    step += 1;
  }

  function finishOnboarding() {
    if (editProgramId) {
      updateProgram(
        editProgramId,
        programName,
        businessType,
        businessCategory,
        payeeEmail
      );
    } else {
      createProgram(programName, businessType, businessCategory, payeeEmail);
    }
    // Dispatch complete event to parent to trigger view change
    dispatch("complete");
  }

  function handleBack() {
    if (step > initialStep) {
      step -= 1;
    } else {
      dispatch("cancel");
    }
  }
</script>

<div class="flex min-h-screen w-full flex-col bg-slate-50 p-8 pt-4">
  <!-- Onboarding Content Area -->
  <div class="flex h-full w-full items-center justify-center pt-10">
    <!-- STEP 1: Choose Your Journey -->
    {#if step === 1}
      <div class="flex flex-col items-center">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">
          Choose Your Journey
        </h1>
        <p class="mt-3 text-[15px] font-medium text-slate-500">
          Select your role to get started with our platform
        </p>

        <div class="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          <!-- Payee Card -->
          <div
            class="flex w-[320px] flex-col items-center rounded-3xl border border-slate-100 bg-white px-6 py-10 shadow-sm transition-all hover:shadow-md hover:border-slate-200"
          >
            <div
              class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400"
            >
              <User
                class="h-6 w-6"
                strokeWidth={1.5}
              />
            </div>
            <h2 class="text-[20px] font-semibold text-slate-900">Payee</h2>
            <p
              class="mt-2 text-center text-[13px] font-medium text-slate-500 leading-relaxed px-2"
            >
              Receive payments from payers and manage your earnings seamlessly
            </p>
            <ul
              class="mt-8 flex flex-col gap-3.5 text-[13px] font-medium text-slate-600 w-full px-4"
            >
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Accept payer recommendations</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Track your payments in real-time</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Manage multiple payers</span>
              </li>
            </ul>
            <button
              class="mt-10 w-full rounded-2xl bg-slate-100 px-6 py-3.5 text-[15px] font-semibold text-slate-500 cursor-not-allowed"
              >Select Payee</button
            >
          </div>

          <!-- Payer Card (Active for demo) -->
          <div
            class="flex w-[320px] flex-col items-center rounded-3xl border-2 border-slate-100 bg-white px-6 py-10 shadow-xl shadow-slate-200/50 scale-105 relative"
          >
            <!-- Badge overlay -->
            <div
              class="absolute -top-3 bg-[#0066cc] text-white text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-full shadow-sm"
            >
              Recommended
            </div>
            <div
              class="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-blue-50 bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/20"
            >
              <Building2
                class="h-6 w-6"
                strokeWidth={2}
              />
            </div>
            <h2 class="text-[20px] font-semibold text-slate-900">Payer</h2>
            <p
              class="mt-2 text-center text-[13px] font-medium text-slate-500 leading-relaxed px-2"
            >
              Set up payment programs and manage payees efficiently
            </p>
            <ul
              class="mt-8 flex flex-col gap-3.5 text-[13px] font-medium text-slate-600 w-full px-4"
            >
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Configure payment programs</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Recommend and onboard payees</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Manage deductions and cards</span>
              </li>
            </ul>
            <button
              onclick={nextStep}
              class="mt-10 w-full rounded-2xl bg-[#0066cc] px-6 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
              >Select Payer</button
            >
          </div>

          <!-- Admin Card -->
          <div
            class="flex w-[320px] flex-col items-center rounded-3xl border border-slate-100 bg-white px-6 py-10 shadow-sm transition-all hover:shadow-md hover:border-slate-200"
          >
            <div
              class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400"
            >
              <Shield
                class="h-6 w-6"
                strokeWidth={1.5}
              />
            </div>
            <h2 class="text-[20px] font-semibold text-slate-900">Admin</h2>
            <p
              class="mt-2 text-center text-[13px] font-medium text-slate-500 leading-relaxed px-2"
            >
              Manage system configuration and user permissions securely
            </p>
            <ul
              class="mt-8 flex flex-col gap-3.5 text-[13px] font-medium text-slate-600 w-full px-4"
            >
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Manage user roles</span>
              </li>
              <li class="flex items-start gap-2.5">
                <CheckCircle2
                  class="h-[18px] w-[18px] text-[#0066cc] mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span>Give permissions across modules</span>
              </li>
            </ul>
            <!-- Spacer to align buttons since fewer bullets -->
            <div class="flex-1"></div>
            <button
              class="mt-6 w-full rounded-2xl bg-slate-100 px-6 py-3.5 text-[15px] font-semibold text-slate-500 cursor-not-allowed"
              >Select Admin</button
            >
          </div>
        </div>
      </div>

      <!-- STEP 2: Welcome Payer Modal -->
    {:else if step === 2}
      <div
        class="flex w-full max-w-md flex-col items-center justify-center rounded-[32px] bg-white p-12 shadow-2xl"
      >
        <div class="flex w-full items-start justify-between">
          <div>
            <h2 class="text-3xl font-semibold text-slate-900">
              Welcome <span class="text-[#0066cc]">Payer!</span>
            </h2>
            <p class="mt-2 text-[15px] font-medium text-slate-600">
              Acme Insurance
            </p>
          </div>
          <Building2
            class="h-10 w-10 text-slate-800"
            strokeWidth={1}
          />
        </div>
        <button
          onclick={nextStep}
          class="mt-12 w-full rounded-2xl bg-[#0066cc] py-4 text-[15px] font-semibold text-white shadow-md transition-colors hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
        >
          Start Program Setup
        </button>
      </div>

      <!-- STEP 3: Program Configuration Form -->
    {:else if step === 3}
      <!-- This will be a wide card matching the 3rd wireframe -->
      <div
        class="w-full max-w-4xl rounded-[32px] bg-white p-12 shadow-xl relative mt-12"
      >
        <button
          onclick={handleBack}
          class="absolute top-8 right-8 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <ArrowLeft class="h-4 w-4" /> Back
        </button>

        <h2 class="text-2xl font-semibold text-slate-900 mt-6 md:mt-0">
          Program Configuration
        </h2>
        <p class="mt-1 text-sm font-medium text-slate-500">
          Set up your payment program details
        </p>

        <!-- ... input fields block ... -->
        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
          <!-- Text Inputs -->
          <div class="flex flex-col gap-2">
            <label
              for="programName"
              class="text-xs font-semibold text-slate-700">Program Name*</label
            >
            <input
              id="programName"
              type="text"
              bind:value={programName}
              placeholder="Medical Program"
              class="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]"
            />
          </div>
          <div class="flex flex-col gap-2 relative">
            <label
              for="businessType"
              class="text-xs font-semibold text-slate-700"
              >Business Type *</label
            >
            <CustomSelect
              id="businessType"
              bind:value={businessType}
              options={[
                "Healthcare",
                "Insurance",
                "Transport",
                "Pharmacy",
                "Logistics",
                "Retail",
                "Manufacturing"
              ]}
            />
          </div>
          <div class="flex flex-col gap-2 relative">
            <label
              for="businessCategory"
              class="text-xs font-semibold text-slate-700"
              >Business Category *</label
            >
            <CustomSelect
              id="businessCategory"
              bind:value={businessCategory}
              options={[
                "Hospital",
                "Clinic",
                "Diagnostic Center",
                "Emergency Services",
                "Wellness Center",
                "Life Insurance",
                "General Insurance",
                "Health Insurance"
              ]}
            />
          </div>
        </div>

        <div class="mt-8">
          <span class="block text-xs font-semibold text-slate-700"
            >Primary Card Configuration *</span
          >
          <div class="mt-4 flex gap-6">
            <!-- Simulated Blue Virtual Card -->
            <div
              class="flex h-48 w-80 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#003366] to-[#004a99] p-6 shadow-lg relative cursor-pointer ring-2 ring-offset-2 ring-[#0066cc]"
            >
              <div class="flex justify-between w-full text-white/90">
                <span class="text-xs font-medium">Virtual card</span>
                <div
                  class="h-6 w-10 rounded-sm bg-orange-400 opacity-80 mix-blend-multiply relative"
                >
                  <div
                    class="absolute -left-3 h-6 w-6 rounded-full bg-red-500/80 mix-blend-multiply"
                  ></div>
                  <div
                    class="absolute h-6 w-6 rounded-full bg-yellow-500/80 mix-blend-multiply"
                  ></div>
                </div>
              </div>
              <div class="flex justify-between w-full text-white/90 mt-auto">
                <span class="font-mono text-[13px] tracking-widest"
                  >**** **** **** 1289</span
                >
                <span class="font-mono text-xs">09/25</span>
              </div>
            </div>

            <!-- Simulated White Virtual Card -->
            <div
              class="flex h-48 w-80 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer hover:border-slate-300"
            >
              <div class="flex justify-between w-full text-slate-500">
                <span class="text-xs font-medium">Virtual card</span>
                <div
                  class="h-6 w-10 rounded-sm bg-orange-400 mix-blend-multiply relative"
                >
                  <div
                    class="absolute -left-3 h-6 w-6 rounded-full bg-red-500 mix-blend-multiply"
                  ></div>
                  <div
                    class="absolute h-6 w-6 rounded-full bg-yellow-500 mix-blend-multiply"
                  ></div>
                </div>
              </div>
              <div class="flex justify-between w-full text-slate-700 mt-auto">
                <span class="font-mono text-[13px] tracking-widest"
                  >**** **** **** ****</span
                >
                <span class="font-mono text-xs">00/00</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex gap-12 text-xs font-medium text-slate-600">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="cardType"
                checked
                class="accent-[#7d326f] mt-1 hover:scale-110 transition-transform cursor-pointer"
              />
              <div class="flex flex-col">
                <span class="font-semibold text-slate-800 text-[13px]"
                  >Attach Existing Primary Card</span
                >
                <span class="text-[11px] text-slate-400 mt-0.5"
                  >Link an existing card for program funding</span
                >
              </div>
            </label>
            <label class="flex items-start gap-3 cursor-pointer opacity-50">
              <input
                type="radio"
                name="cardType"
                disabled
                class="mt-1"
              />
              <div class="flex flex-col">
                <span class="font-semibold text-slate-800 text-[13px]"
                  >Request New Primary Card</span
                >
                <span class="text-[11px] text-slate-400 mt-0.5"
                  >Request a new card to be issued for this program</span
                >
              </div>
            </label>
          </div>
        </div>

        <div class="mt-8">
          <span class="block text-xs font-semibold text-slate-700"
            >Deduction Settings *</span
          >
          <div class="mt-3 flex gap-4">
            {#each ["Standard Deduction %", "GST %", "Both", "Neither"] as setting}
              <!-- Fixed height to prevent jumping -->
              <button
                onclick={() => (deductionSetting = setting)}
                class="relative h-[84px] w-full rounded-xl border px-2 py-3 text-xs font-semibold transition-all cursor-pointer
                  {deductionSetting === setting
                  ? 'border-[#7d326f] bg-purple-50/50 text-[#7d326f] flex flex-col items-center justify-start'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50 flex flex-col items-center justify-start'}"
              >
                <div class="flex items-center gap-2 mt-1">
                  <div
                    class="h-4 w-4 shrink-0 rounded-full border-2 {deductionSetting ===
                    setting
                      ? 'border-[#0066cc] bg-[#0066cc] outline outline-2 outline-offset-1 outline-[#0066cc]'
                      : 'border-slate-300'}"
                  ></div>
                  <span class="text-center">{setting}</span>
                </div>

                <div class="h-6 mt-2 w-full flex justify-center">
                  {#if deductionSetting === setting && setting === "GST %"}
                    <div
                      class="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded w-3/4 text-center font-semibold text-slate-700 shadow-sm"
                    >
                      5 %
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <div class="mt-10 flex flex-col gap-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <!-- Block 1: Recommend Payee System -->
            <div
              class="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 h-full"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-slate-700"
                  >
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    /><circle
                      cx="9"
                      cy="7"
                      r="4"
                    /><path d="m22 11-l.5 .5" /><path d="M16 11h6" /><path
                      d="M19 8v6"
                    />
                  </svg>
                </div>
                <div class="flex flex-col">
                  <span class="font-semibold text-slate-800 text-[14px]"
                    >Recommend Payees</span
                  >
                  <span class="text-[11px] font-medium text-slate-500 mt-0.5"
                    >Select from our trusted network</span
                  >
                </div>
              </div>
              <div class="mt-2 text-xs text-slate-500">
                <CustomSelect
                  id="recommendSelect"
                  value="Select Provider"
                  options={[
                    "Select Provider",
                    "Apollo Hospitals",
                    "Fresh Clinic",
                    "Narayana Health"
                  ]}
                />
              </div>
            </div>

            <!-- Block 2: Add Manual Payee -->
            <div
              class="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 h-full"
            >
              <div class="flex gap-4">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-slate-700"
                  >
                    <rect
                      width="20"
                      height="16"
                      x="2"
                      y="4"
                      rx="2"
                    /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div class="flex flex-col">
                  <span class="font-semibold text-slate-800 text-[14px]"
                    >Add Payee (Email)</span
                  >
                  <span class="text-[11px] font-medium text-slate-500 mt-0.5"
                    >Invite someone off-platform</span
                  >
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2">
                <input
                  type="email"
                  bind:value={manualEmail}
                  placeholder="Enter email address"
                  class="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]"
                />
                <button
                  onclick={handleManualAdd}
                  class="h-10 px-5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700 cursor-pointer shadow-sm transition-colors whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <!-- Rended Added Labels -->
          <div class="flex flex-wrap gap-2 px-1">
            {#each addedPayees as email}
              <div
                class="px-3 py-1.5 bg-[#e8f8f5] text-[#1a7f71] border border-[#8cdccb] rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 class="h-3.5 w-3.5 stroke-[2.5]" />
                {email}
              </div>
            {/each}
          </div>
        </div>

        <div class="mt-10 flex flex-col items-start gap-4">
          <button
            onclick={nextStep}
            class="h-14 w-[340px] rounded-2xl bg-[#0066cc] text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
          >
            Complete Setup
          </button>
        </div>
      </div>

      <!-- STEP 4: Success Modal -->
    {:else if step === 4}
      <div
        class="w-full max-w-[420px] rounded-[24px] bg-white p-6 md:p-8 shadow-2xl relative mt-16 mx-auto border border-slate-100 ring-1 ring-slate-900/5"
      >
        <button
          onclick={handleBack}
          class="absolute top-4 left-4 flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 border border-slate-100 z-20"
        >
          <ArrowLeft class="h-3.5 w-3.5" /> Back
        </button>

        <div class="relative pt-10 pb-2">
          <!-- Diamond Icon -->
          <div
            class="absolute left-1/2 -top-16 -translate-x-1/2 z-10 flex h-20 w-20 items-center justify-center"
          >
            <div
              class="absolute inset-0 rotate-45 rounded-[18px] bg-[#0066cc] shadow-xl shadow-blue-500/20"
            ></div>
            <div
              class="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[#0066cc] z-10 box-content"
            >
              <Check
                class="h-6 w-6 text-white"
                strokeWidth={4.5}
              />
            </div>
          </div>

          <!-- Content Card -->
          <div
            class="rounded-[20px] overflow-hidden border border-slate-200 shadow-sm relative w-full mb-6"
          >
            <div class="bg-[#0066cc] pt-10 pb-4 text-center px-4">
              <h2 class="text-[22px] font-bold text-white tracking-tight">
                Program Configured!
              </h2>
            </div>
            <div
              class="bg-blue-50/50 px-6 py-6 text-left border-t border-blue-100/50"
            >
              <h3 class="text-[14px] font-semibold text-[#003366] mb-4">
                What happens now?
              </h3>
              <ul
                class="flex flex-col gap-3.5 text-[13px] font-medium text-slate-600 list-disc pl-4 marker:text-blue-300"
              >
                <li>
                  We will proceed with activating the program limits in your
                  core system
                </li>
                <li>
                  Your chosen payees will begin receiving onboarding invitations
                </li>
                <li>
                  The program bounds will be active and ready to use within 48
                  hours
                </li>
              </ul>
            </div>
          </div>

          <button
            onclick={finishOnboarding}
            class="w-full rounded-[14px] border-2 border-[#0066cc] bg-transparent py-3.5 text-[15px] font-bold text-[#0066cc] transition-all hover:bg-[#0066cc] hover:text-white"
          >
            Go Ahead
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
