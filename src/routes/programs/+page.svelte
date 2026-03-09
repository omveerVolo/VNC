<script lang="ts">
  import TopBar from "$lib/components/dashboard/TopBar.svelte";
  import { goto } from "$app/navigation";
  import { User, AlertCircle, X, CheckCircle2 } from "lucide-svelte";
  import { authState } from "$lib/state/auth.svelte.js";
  import { dbStore, cancelEnrollment } from "$lib/state/db.svelte.js";

  // Derive programs from global state, filtering for the current user's role mapping
  let programs = $derived(
    dbStore.programs.filter((p: any) => {
      if (!authState.user) return false;
      if (authState.user.role === "admin") return true;
      if (authState.user.role === "payer")
        return p.payerId === authState.user.id;
      // Payees see programs they are enrolled in
      return (
        p.enrolledPayees.includes(authState.user.id) ||
        p.enrolledPayees.length === 0
      );
    })
  );

  // Helper to count payouts for a specific user within a specific program
  const getPayoutCountForUser = (programId: string) => {
    if (!authState.user?.id) return 0;
    return dbStore.payouts.filter(
      (p: any) => p.programId === programId && p.userId === authState.user?.id
    ).length;
  };

  // Helper to count total unique payees in a program
  const getPayeeCountForProgram = (program: any) => {
    return program.enrolledPayees?.length || 0;
  };

  let activeCancelId = $state<string | null>(null);

  function confirmCancel(id: string) {
    if (authState.user?.id) {
      cancelEnrollment(id, authState.user.id);
    }
    activeCancelId = null;
  }
</script>

<svelte:head>
  <title>Programs - HDFC Bank</title>
</svelte:head>

<div class="flex min-h-screen w-full flex-col bg-slate-50 relative">
  <TopBar />

  <div class="flex w-full flex-col items-center justify-start p-8 pt-6 pb-20">
    <div
      class="w-full max-w-[1400px] flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
    >
      <!-- Header Row -->
      <div
        class="border-b border-slate-200 bg-[#f8f9fa] px-6 py-5 flex items-start flex-col"
      >
        <h1 class="text-[17px] font-semibold text-[#003366]">Programs</h1>
        <p class="mt-0.5 text-[12px] font-medium text-slate-500">
          Manage your payment programs
        </p>
      </div>

      <div class="p-6 md:p-8 flex flex-col w-full">
        <!-- Action Row -->
        <div class="mb-6 flex w-full">
          <!-- Navigates back to home to invoke onboarding explicitly. Hidden for payees -->
          {#if authState.user?.role !== "payee"}
            <button
              onclick={() => goto("/?createProgram=true")}
              class="flex h-11 items-center justify-center rounded-xl border border-slate-800 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
            >
              + New Program
            </button>
          {/if}
        </div>

        <!-- Program List -->
        <div class="flex flex-col gap-6">
          {#each programs as program}
            <div
              class="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col pt-6 pb-4"
            >
              <!-- Top Section -->
              <div class="flex justify-between items-start px-6 mb-5">
                <div class="flex flex-col">
                  <h3 class="text-[17px] font-semibold text-[#003366]">
                    {program.name}
                  </h3>
                  <span class="text-[13px] font-medium text-slate-400 mt-1">
                    {program.category}
                    <span class="mx-1.5">•</span>
                    Created {program.createdAt} by {program.createdBy}
                  </span>
                </div>

                <div class="flex items-center gap-2 mt-1">
                  <div
                    class="bg-[#e8f8f5] text-[#1a7f71] px-3 py-1.5 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-default border border-[#8cdccb]"
                  >
                    <CheckCircle2 class="h-4 w-4 stroke-[2.5]" />
                    {program.status}
                  </div>
                </div>
              </div>

              <!-- Divider & Bottom Section -->
              <div class="w-full px-5 pb-1 relative">
                <div
                  class="bg-[#f5f0f3] rounded-xl p-3.5 flex justify-between items-center"
                >
                  <!-- Context Switcher based on Role -->
                  {#if authState.user?.role === "payee"}
                    <div
                      class="flex items-center px-4 font-semibold text-slate-800 text-[14px]"
                    >
                      <span class="text-[15px] mr-1"
                        >{getPayoutCountForUser(program.id)}</span
                      > payouts received
                    </div>

                    <!-- Payee specific action -->
                    <div class="relative">
                      <button
                        onclick={() => (activeCancelId = program.id)}
                        class="text-[13px] font-semibold text-slate-600 bg-white shadow-sm transition-colors rounded-xl flex items-center gap-1.5 px-4 py-2 cursor-pointer hover:bg-slate-50 border border-slate-200"
                      >
                        Cancel Enrollment <X
                          class="h-4 w-4 rounded bg-slate-200 text-slate-600 p-0.5"
                          strokeWidth={3}
                        />
                      </button>
                    </div>
                  {:else}
                    <!-- Payer specific view -->
                    <div class="flex items-center gap-3 px-2">
                      <User class="h-5 w-5 text-slate-600" />
                      <span class="text-[13px] font-medium text-slate-600"
                        >{getPayeeCountForProgram(program)} payees enrolled</span
                      >
                    </div>

                    <button
                      onclick={() => goto(`/?editProgram=${program.id}`)}
                      class="text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#7d326f] shadow-sm transition-colors rounded-xl flex items-center gap-1.5 px-4 py-2 cursor-pointer"
                    >
                      Manage
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Global Cancel Enrollment Modal -->
{#if activeCancelId !== null}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
    onclick={() => (activeCancelId = null)}
  >
    <div
      class="relative w-full max-w-[400px] rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-start gap-5 mb-8">
        <div
          class="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center shrink-0"
        >
          <AlertCircle class="h-6 w-6 text-red-600" />
        </div>
        <div class="flex flex-col pt-1">
          <h2 class="text-[20px] font-semibold text-slate-900 leading-tight mb-1">
            Cancel Enrollment?
          </h2>
          <p class="text-[13px] text-slate-500 leading-relaxed font-medium">
            Are you sure you want to cancel your enrollment in this program?
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 w-full">
        <button
          class="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          onclick={() => (activeCancelId = null)}
        >
          Nevermind
        </button>
        <button
          class="px-6 py-3 rounded-xl bg-[#0066cc] text-white text-[14px] font-semibold shadow-sm hover:bg-[#0052a3] transition-colors cursor-pointer flex items-center justify-center"
          onclick={() => {
            activeCancelId = null;
          }}
        >
          Confirm Cancellation
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Global Cancel Enrollment Modal -->
{#if activeCancelId !== null}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
    onclick={() => (activeCancelId = null)}
  >
    <div
      class="relative w-full max-w-[400px] rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-start gap-5 mb-8">
        <div
          class="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center shrink-0"
        >
          <AlertCircle class="h-6 w-6 text-red-600" />
        </div>
        <div class="flex flex-col pt-1">
          <h2 class="text-[20px] font-semibold text-slate-900 leading-tight mb-1">
            Cancel Enrollment?
          </h2>
          <p class="text-[13px] text-slate-500 leading-relaxed font-medium">
            Are you sure you want to cancel your enrollment in this program?
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 w-full">
        <button
          class="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          onclick={() => (activeCancelId = null)}
        >
          Nevermind
        </button>
        <button
          class="px-6 py-3 rounded-xl bg-[#0066cc] text-white text-[14px] font-semibold shadow-sm hover:bg-[#0052a3] transition-colors cursor-pointer flex items-center justify-center"
          onclick={() => {
            activeCancelId = null;
          }}
        >
          Confirm Cancellation
        </button>
      </div>
    </div>
  </div>
{/if}
