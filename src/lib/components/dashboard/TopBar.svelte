<script lang="ts">
  let { showSearch = true } = $props();
  import { Search, Bell } from "lucide-svelte";
  import { authState } from "$lib/state/auth.svelte.js";
  import {
    dbStore,
    acceptInvitation,
    rejectInvitation
  } from "$lib/state/db.svelte.js";
  import { goto } from "$app/navigation";
  import { Check, X } from "lucide-svelte";

  let isDropdownOpen = $state(false);

  let userNotifications = $derived(
    dbStore.notifications.filter((n: any) => n.userId === authState.user?.id)
  );

  function toggleRole() {
    if (!authState.user) return;

    // Toggle role between payer and payee
    const newRole = authState.user.role === "payer" ? "payee" : "payer";
    authState.user.role = newRole;

    // Trigger navigation to refresh the dashboard data context
    goto(`/?role=${newRole}`, { invalidateAll: true });
  }
</script>

<div class="flex h-24 w-full items-center justify-between px-8 bg-slate-50">
  <!-- Left Side: Search Bar -->
  <div class="flex w-full max-w-xl items-center">
    {#if showSearch}
      <div class="relative w-full max-w-md">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
        >
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Start Typing...."
          class="h-11 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#7d326f]/20 transition-all"
        />
        <button
          class="absolute inset-y-1.5 right-1.5 flex items-center gap-1.5 rounded-xl bg-[#e8e4f4] px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#d8d2ec] cursor-pointer"
        >
          <Search class="h-3.5 w-3.5" />
          Search
        </button>
      </div>
    {/if}
  </div>

  <!-- Right Side: Role Switcher & Notifications -->
  <div class="flex items-center gap-6">
    <!-- Role Switcher -->
    <button
      onclick={toggleRole}
      class="flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
    >
      Switch to <span class="ml-1 font-semibold text-[#7d326f] capitalize"
        >{authState.user?.role === "payer" ? "Payee" : "Payer"}</span
      >
    </button>

    <!-- Notification Bell -->
    <div class="relative">
      <button
        onclick={() => (isDropdownOpen = !isDropdownOpen)}
        class="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 border border-slate-100 cursor-pointer"
      >
        <Bell
          class="h-[22px] w-[22px]"
          strokeWidth={1.5}
        />
        <!-- Notification Dot -->
        {#if userNotifications.filter((n: any) => !n.read).length > 0}
          <span
            class="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
          ></span>
        {/if}
      </button>

      <!-- Notification Dropdown -->
      {#if isDropdownOpen}
        <div
          class="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
        >
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-semibold text-slate-800">Notifications</h3>
            <button
              class="text-xs font-medium text-[#7d326f] hover:underline cursor-pointer"
              >Mark all read</button
            >
          </div>

          <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {#if userNotifications.length === 0}
              <div class="p-3 text-center text-sm text-slate-500">
                No new notifications
              </div>
            {:else}
              {#each userNotifications as notification}
                <!-- Dynamic Notification Item -->
                <div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <div
                    class="mt-0.5 h-2 w-2 shrink-0 rounded-full {notification.read
                      ? 'bg-slate-300'
                      : 'bg-[#7d326f]'}"
                  ></div>
                  <div>
                    <p class="text-[13px] font-medium text-slate-800">
                      {notification.title}
                    </p>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {notification.message}
                    </p>
                    <!-- Fallback date if not strictly ISO, generic display -->
                    <p class="mt-1 text-[10px] text-slate-400">Just now</p>
                  </div>

                  {#if notification.type === "invitation"}
                    <div
                      class="ml-auto flex items-center gap-1.5 self-center pl-2"
                    >
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          acceptInvitation(
                            notification.id,
                            notification.programId,
                            authState.user?.email || "usr_payee_01"
                          );
                        }}
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 cursor-pointer border border-emerald-100"
                        title="Accept Invitation"
                      >
                        <Check
                          class="h-4 w-4"
                          strokeWidth={2.5}
                        />
                      </button>
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          rejectInvitation(notification.id);
                        }}
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 cursor-pointer border border-rose-100"
                        title="Decline Invitation"
                      >
                        <X
                          class="h-4 w-4"
                          strokeWidth={2.5}
                        />
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
