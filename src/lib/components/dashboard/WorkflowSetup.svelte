<script lang="ts">
  import { Users, UserPlus, X, Trash2, PlusCircle } from "lucide-svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  // "approval_always" or "auto_limit"
  let selectedWorkflowType = $state<string | null>(null);
  let step = $state(1);

  // Form State
  let firstApprovalBy = $state("Manager");
  let conditionField = $state("Amount more than");
  let conditionOperator = $state("Select");
  let conditionValue = $state("10,000");
  let redeemEntity = $state("surfPool");
  let redeemRole = $state("Ops");

  function handleNext() {
    if (step === 1 && selectedWorkflowType) {
      step = 2;
    }
  }

  function handleSave() {
    // In reality this would dispatch the payload to an API
    dispatch("save");
  }
</script>

<div class="flex items-start w-full transition-all">
  <!-- Page Content -->
  <div
    class="relative w-full max-w-4xl rounded-[32px] bg-white p-10 shadow-sm border border-slate-200 overflow-visible min-h-[600px] flex flex-col"
  >
    <!-- Header -->
    <div class="mb-10 w-full pl-2 pr-6">
      <h2
        class="text-[34px] font-black tracking-tight text-slate-900 leading-none"
      >
        New Workflow Rule
      </h2>
      <p class="mt-3 text-[15px] font-medium text-slate-500">
        Set approval workflow rules below
      </p>
    </div>

    <!-- Scrollable Body -->
    <div class="flex-1 w-full flex flex-col px-2">
      <h3 class="font-semibold text-sm text-slate-900 mb-4">
        Set Approval Workflow
      </h3>

      {#if step === 1}
        <!-- Step 1: Selection Cards -->
        <div class="grid grid-cols-1 gap-4">
          <!-- Always Needed Selection -->
          <button
            onclick={() => (selectedWorkflowType = "approval_always")}
            class="flex w-full items-center gap-4 rounded-2xl border {selectedWorkflowType ===
            'approval_always'
              ? 'border-[#7d326f] bg-[#ebddef]/30 ring-1 ring-[#7d326f]/20'
              : 'border-slate-200 bg-white hover:border-slate-300'} p-5 transition-all text-left"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ebddef] text-[#7d326f]"
            >
              <Users class="h-6 w-6" />
            </div>
            <span class="text-[17px] font-semibold text-slate-900"
              >Approval always needed</span
            >
          </button>

          <!-- Auto Limit Selection -->
          <button
            onclick={() => (selectedWorkflowType = "auto_limit")}
            class="flex w-full items-center gap-4 rounded-2xl border {selectedWorkflowType ===
            'auto_limit'
              ? 'border-[#7d326f] bg-[#ebddef]/30 ring-1 ring-[#7d326f]/20'
              : 'border-slate-200 bg-white hover:border-slate-300'} p-5 transition-all text-left"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ebddef] text-[#7d326f]"
            >
              <UserPlus class="h-6 w-6" />
            </div>
            <span class="text-[17px] font-semibold text-slate-900"
              >Auto approve up to a limit, then seek approval</span
            >
          </button>
        </div>
      {:else if step === 2 && selectedWorkflowType === "approval_always"}
        <!-- Step 2: Configuration Body -->
        <div class="flex flex-col gap-4">
          <!-- Big Container Wrapper -->
          <div
            class="w-full rounded-[24px] border border-slate-200 p-6 flex flex-col bg-white"
          >
            <div class="flex w-full items-center gap-4 mb-6">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ebddef] text-[#7d326f]"
              >
                <Users class="h-6 w-6" />
              </div>
              <span class="text-[17px] font-semibold text-slate-900"
                >Approval always needed</span
              >
            </div>

            <div class="grid grid-cols-2 gap-4 items-center">
              <div
                class="flex h-[52px] items-center rounded-xl border border-slate-200 px-5 text-[15px] font-medium text-slate-800"
              >
                1st Approval by
              </div>
              <div class="h-[52px] relative z-40">
                <CustomSelect
                  id="firstApproval"
                  bind:value={firstApprovalBy}
                  options={["Manager", "Director", "VP", "CFO"]}
                />
              </div>
            </div>

            <!-- Condition Block Overlay -->
            <div
              class="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-6 relative"
            >
              <button
                class="absolute -right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-rose-500 transition-colors p-2"
              >
                <Trash2 class="h-5 w-5" />
              </button>

              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                  <span class="w-8 text-sm font-semibold text-slate-800"
                    >If</span
                  >

                  <div class="grid grid-cols-3 gap-3 w-full">
                    <div
                      class="relative w-full h-11 flex items-center text-sm font-semibold text-slate-800"
                    >
                      Amount more than
                    </div>
                    <div class="relative w-full h-11 z-[50]">
                      <CustomSelect
                        id="condOp"
                        bind:value={conditionOperator}
                        options={["Select", "Is strictly", "Less than"]}
                      />
                    </div>
                    <div class="relative w-full">
                      <input
                        type="text"
                        bind:value={conditionValue}
                        class="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-sm font-medium text-slate-800 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f]"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-center py-1">
                  {null}
                  <!-- Spacer mapping for 'Then' -->
                </div>

                <div class="flex items-center gap-3">
                  <span class="w-8 text-sm font-semibold text-slate-800"
                    >Then</span
                  >

                  <div class="grid grid-cols-3 gap-3 w-full items-end">
                    <div class="flex flex-col gap-1.5 w-full">
                      <div
                        class="relative w-full h-11 flex items-center text-sm font-semibold text-slate-800"
                      >
                        Redeem by
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5 w-full relative z-[45]">
                      <label
                        for="redeemEntity"
                        class="text-xs font-semibold text-slate-600 -translate-y-[2px]"
                        >Entity</label
                      >
                      <div class="h-11">
                        <CustomSelect
                          id="redeemEntity"
                          bind:value={redeemEntity}
                          options={["SurfPool", "External", "Partner"]}
                        />
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5 w-full relative z-[40]">
                      <label
                        for="redeemRole"
                        class="text-xs font-semibold text-slate-600 -translate-y-[2px]"
                        >Role</label
                      >
                      <div class="h-11">
                        <CustomSelect
                          id="redeemRole"
                          bind:value={redeemRole}
                          options={["Ops", "Admin", "Reviewer"]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex flex-col gap-3">
              <button
                class="flex items-center gap-2 text-[13px] font-semibold text-[#7d326f] hover:text-[#5b2451] hover:underline w-max transition-colors"
              >
                <PlusCircle class="h-4 w-4" /> Add another level of approval
              </button>
              <button
                class="flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900 hover:underline w-max"
              >
                <PlusCircle class="h-4 w-4" /> Add amount exception
              </button>
            </div>
          </div>

          <!-- Auto Limit Container Header Mock (Inactive) -->
          <div
            class="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ebddef] text-[#7d326f]"
            >
              <UserPlus class="h-6 w-6" />
            </div>
            <span class="text-[17px] font-semibold text-slate-900"
              >Auto approve up to a limit, then seek approval</span
            >
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer Action -->
    <div class="mt-8 flex justify-end px-2 pt-4">
      <button
        onclick={step === 1 ? handleNext : handleSave}
        disabled={step === 1 && !selectedWorkflowType}
        class="h-12 w-32 rounded-xl bg-[#7d326f] text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#68295c] hover:shadow-lg focus:ring-2 focus:ring-[#7d326f]/50 focus:ring-offset-2 disabled:bg-slate-300 disabled:pointer-events-none disabled:transform-none cursor-pointer"
      >
        {step === 1 ? "Next" : "Save"}
      </button>
    </div>
  </div>
</div>
