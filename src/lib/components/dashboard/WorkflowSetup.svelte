<script lang="ts">
  import {
    Users,
    UserPlus,
    Trash2,
    PlusCircle,
    CheckCircle
  } from "lucide-svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import { createEventDispatcher } from "svelte";
  import { dbStore } from "$lib/state/db.svelte.js";

  const dispatch = createEventDispatcher();

  // Accordion & View State
  let isApprovalAlwaysExpanded = $state(false);
  let isAmountExceptionExpanded = $state(false);
  let isSuccess = $state(false);

  // Form State
  let availablePrograms = $derived([
    "All Programs",
    ...dbStore.programs.map((p: any) => p.name)
  ]);
  let selectedProgram = $state("All Programs");
  let firstApprovalBy = $state("Manager");
  let conditionOperator = $state("Select");
  let conditionValue = $state("0");
  let redeemEntity = $state("Volo");
  let redeemRole = $state("Ops");

  function handleSave() {
    isSuccess = true;
  }
</script>

<div
  class="flex items-center justify-center min-h-[calc(100vh-8rem)] w-full transition-all"
>
  {#if isSuccess}
    <!-- SUCCESS SCREEN -->
    <div
      class="relative w-full max-w-[500px] rounded-[32px] bg-white p-16 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300"
    >
      <div
        class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 border-4 border-white shadow-[0_0_15px_rgba(0,102,204,0.15)] bg-gradient-to-tr from-blue-50 to-white"
      >
        <CheckCircle
          class="h-10 w-10 text-[#0066cc]"
          strokeWidth={2.5}
        />
      </div>
      <h2
        class="text-[28px] font-semibold tracking-tight text-[#003366] leading-tight"
      >
        Approval workflow<br />configured successfully.
      </h2>
    </div>
  {:else}
    <!-- SETUP SCREEN -->
    <div
      class="relative w-full max-w-[750px] rounded-[32px] bg-white p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 min-h-[500px] flex flex-col"
    >
      <!-- Header -->
      <div class="mb-8 w-full">
        <h2
          class="text-[24px] font-bold tracking-tight text-slate-900 leading-none"
        >
          New Workflow Rule
        </h2>
        <p class="mt-2.5 text-[13px] font-semibold text-slate-400">
          Set approval workflow rules below
        </p>
      </div>

      <div class="flex-1 w-full flex flex-col">
        <!-- Program Selector -->
        <div class="mb-8 flex flex-col gap-2 relative z-[60]">
          <h3 class="font-bold text-[13px] text-slate-900">Select Program</h3>
          <CustomSelect
            id="programSelect"
            bind:value={selectedProgram}
            options={availablePrograms}
          />
        </div>

        <h3 class="font-bold text-[13px] text-slate-900 mb-3">
          Set Approval Workflow
        </h3>

        <!-- Accordion container -->
        <div
          class="flex flex-col gap-3 rounded-[12px] border border-slate-300 overflow-hidden bg-white"
        >
          <!-- Always Needed Selection Item -->
          <div
            class="flex flex-col w-full transition-all {isApprovalAlwaysExpanded
              ? 'pb-2'
              : ''}"
          >
            <button
              onclick={() =>
                (isApprovalAlwaysExpanded = !isApprovalAlwaysExpanded)}
              class="flex w-full items-center gap-4 bg-white p-4 transition-all text-left cursor-pointer"
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white"
              >
                <Users
                  class="h-6 w-6"
                  strokeWidth={2}
                />
              </div>
              <span class="text-[15px] font-bold text-slate-900">
                Approval always needed
              </span>
            </button>

            <!-- Expanded Config -->
            {#if isApprovalAlwaysExpanded}
              <div
                class="px-5 pt-2 pb-4 animate-in slide-in-from-top-2 duration-200"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-[42px] items-center rounded-xl border border-slate-300 px-4 text-[13px] font-medium text-slate-800 bg-white min-w-[140px]"
                  >
                    1st Approval by
                  </div>
                  <div class="h-[42px] flex-1 relative z-[50]">
                    <CustomSelect
                      id="firstApproval"
                      bind:value={firstApprovalBy}
                      options={["Admin", "Manager", "Ops"]}
                    />
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-2 text-[13px] font-semibold">
                  <button
                    class="flex items-center gap-2 text-[#0066cc] hover:text-[#0052a3] w-max transition-colors cursor-pointer"
                  >
                    <PlusCircle class="h-4 w-4" /> Add another level of approval
                  </button>
                  <button
                    onclick={() =>
                      (isAmountExceptionExpanded = !isAmountExceptionExpanded)}
                    class="flex items-center gap-2 text-slate-700 hover:text-slate-900 w-max transition-colors cursor-pointer"
                  >
                    <PlusCircle class="h-4 w-4" /> Add amount exception
                  </button>
                </div>

                <!-- Exception Block -->
                {#if isAmountExceptionExpanded}
                  <div
                    class="mt-5 rounded-2xl bg-slate-100 border border-slate-200 p-5 relative animate-in fade-in duration-200"
                  >
                    <button
                      onclick={() => (isAmountExceptionExpanded = false)}
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-rose-500 transition-colors p-1.5 cursor-pointer"
                    >
                      <Trash2 class="h-5 w-5" />
                    </button>

                    <div class="flex flex-col gap-0 w-[calc(100%-24px)]">
                      <!-- If Condition -->
                      <div class="flex items-center gap-6 w-full h-[68px]">
                        <span
                          class="w-[40px] text-[15px] font-bold text-slate-800"
                          >If</span
                        >
                        <div class="flex flex-1 gap-6 items-center w-full">
                          <!-- <div
                            class="text-[15px] font-bold text-[#1f2937] whitespace-nowrap min-w-[140px]"
                          >
                            Amount more than
                          </div> -->
                          <div class="flex-1 h-[46px] relative z-[45]">
                            <CustomSelect
                              id="amountCondition"
                              bind:value={conditionOperator}
                              options={["Select", "Is Limit", "Equals"]}
                            />
                          </div>
                          <div class="flex-1 h-[46px]">
                            <input
                              type="text"
                              bind:value={conditionValue}
                              class="w-full h-full bg-white border border-slate-300 rounded-[10px] px-4 text-[14px] font-medium text-slate-800 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f]"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        class="w-full border-t border-slate-200/60 my-5 mt-6 mb-3"
                      ></div>

                      <!-- Then Condition -->
                      <div class="flex items-center gap-6 w-full min-h-[68px]">
                        <span
                          class="w-[40px] text-[15px] font-bold text-slate-800 pt-[18px]"
                          >Then</span
                        >
                        <div
                          class="flex flex-1 gap-6 items-center flex-wrap sm:flex-nowrap w-full"
                        >
                          <div
                            class="text-[15px] font-bold text-[#1f2937] whitespace-nowrap min-w-[140px] pt-[18px]"
                          >
                            Redeem by
                          </div>

                          <div
                            class="flex-1 flex flex-col gap-1.5 w-full relative z-[40]"
                          >
                            <label
                              for="redeemEntity"
                              class="text-[13px] font-semibold text-[#64748b]"
                              >Entity</label
                            >
                            <div class="h-[46px]">
                              <CustomSelect
                                id="redeemEntity"
                                bind:value={redeemEntity}
                                options={[
                                  "Volo",
                                  "HDFC",
                                  "External",
                                  "Partner"
                                ]}
                              />
                            </div>
                          </div>

                          <div
                            class="flex-1 flex flex-col gap-1.5 w-full relative z-[35]"
                          >
                            <label
                              for="redeemRole"
                              class="text-[13px] font-semibold text-[#64748b]"
                              >Entity</label
                            >
                            <div class="h-[46px]">
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
                {/if}
              </div>
            {/if}
          </div>

          <div class="h-px w-full bg-slate-200"></div>

          <!-- Auto Limit Selection -->
          <button
            class="flex w-full items-center gap-4 bg-white p-4 transition-all text-left cursor-pointer"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white"
            >
              <UserPlus
                class="h-6 w-6"
                strokeWidth={2}
              />
            </div>
            <span class="text-[15px] font-bold text-slate-900">
              Auto approve up to a limit, then seek approval
            </span>
          </button>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="mt-8 flex justify-end">
        <button
          onclick={handleSave}
          class="h-11 w-[120px] rounded-[10px] bg-[#5b4897] text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#4a3a7c] cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  {/if}
</div>
